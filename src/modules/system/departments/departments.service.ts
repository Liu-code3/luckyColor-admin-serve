import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import {
  CreateDepartmentDto,
  DepartmentListQueryDto,
  DepartmentUsersQueryDto,
  UpdateDepartmentDto,
  UpdateDepartmentStatusDto
} from './departments.dto';

type UserWithDepartment = Prisma.UserGetPayload<{
  include: {
    department: true;
  };
}>;

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async list(query: DepartmentListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = this.buildDepartmentWhere({
      OR: keyword
        ? [{ name: { contains: keyword } }, { code: { contains: keyword } }]
        : undefined,
      status: query.status
    });

    const [total, records] = await this.prisma.$transaction([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toDepartmentResponse(item))
    });
  }

  async tree() {
    const records = await this.prisma.department.findMany({
      where: this.buildDepartmentWhere(),
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    return successResponse(
      this.buildTree(records.map((item) => this.toDepartmentResponse(item)))
    );
  }

  async detail(id: number) {
    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentWhere({ id })
    });
    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return successResponse(this.toDepartmentResponse(department));
  }

  async descendantIds(id: number) {
    const departmentIds = await this.findDescendantDepartmentIds(id);

    return successResponse({
      departmentId: id,
      departmentIds
    });
  }

  async users(id: number, query: DepartmentUsersQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const departmentIds = query.includeChildren
      ? await this.findDescendantDepartmentIds(id)
      : [(await this.ensureDepartmentExists(id)).id];

    const where = this.buildUserWhere({
      departmentId: {
        in: departmentIds
      },
      status: query.status,
      OR: keyword
        ? [
            { username: { contains: keyword } },
            { nickname: { contains: keyword } },
            { phone: { contains: keyword } },
            { email: { contains: keyword } }
          ]
        : undefined
    });

    const [total, records] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          department: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toUserResponse(item))
    });
  }

  async create(dto: CreateDepartmentDto) {
    const tenantId = this.tenantScope.resolveRequiredTenantValue();

    try {
      const department = await this.prisma.$transaction(
        async (tx) => {
          await this.ensureDepartmentCodeAvailable(dto.code, undefined, tx);
          await this.validateDepartmentHierarchy(
            dto.parentId ?? null,
            undefined,
            tx
          );

          const created = await tx.department.create({
            data: {
              id: dto.id,
              tenantId,
              parentId: dto.parentId ?? null,
              name: dto.name,
              code: dto.code,
              leader: dto.leader ?? null,
              phone: dto.phone ?? null,
              email: dto.email ?? null,
              sort: dto.sort ?? 0,
              status: dto.status ?? true,
              remark: dto.remark ?? null
            }
          });

          if (dto.sort !== undefined) {
            return created;
          }

          return tx.department.update({
            where: { id: created.id },
            data: {
              sort: created.id
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      return successResponse(this.toDepartmentResponse(department));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    const existing = await this.ensureDepartmentExists(id);

    if (dto.code) {
      await this.ensureDepartmentCodeAvailable(dto.code, id);
    }

    if (dto.parentId !== undefined) {
      await this.validateDepartmentHierarchy(
        dto.parentId === undefined ? existing.parentId : dto.parentId,
        id
      );
    }

    try {
      const department = await this.prisma.department.update({
        where: { id },
        data: {
          parentId: dto.parentId,
          name: dto.name,
          code: dto.code,
          leader: dto.leader,
          phone: dto.phone,
          email: dto.email,
          sort: dto.sort,
          status: dto.status,
          remark: dto.remark
        }
      });

      return successResponse(this.toDepartmentResponse(department));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['tenant_id', 'code']);
    }
  }

  async remove(id: number) {
    await this.prisma.$transaction(
      async (tx) => {
        const records = await tx.department.findMany({
          where: this.buildDepartmentWhere(),
          orderBy: [{ sort: 'asc' }, { id: 'asc' }]
        });
        const target = records.find((item) => item.id === id);
        if (!target) {
          throw new BusinessException(
            BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
          );
        }

        const ids = this.collectDepartmentIds(id, records);
        await tx.department.deleteMany({
          where: this.buildDepartmentWhere({
            id: { in: ids }
          })
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return successResponse(true);
  }

  async findDescendantDepartmentIds(id: number) {
    const tenantId = this.tenantScope.requireTenantId();
    return this.findDescendantDepartmentIdsByTenant(tenantId, id);
  }

  async findDescendantDepartmentIdsByTenant(tenantId: string, id: number) {
    const departments = await this.prisma.department.findMany({
      where: {
        tenantId
      },
      select: {
        id: true,
        parentId: true
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    if (!departments.some((item) => item.id === id)) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return this.collectDepartmentIds(id, departments);
  }

  async updateStatus(id: number, dto: UpdateDepartmentStatusDto) {
    await this.ensureDepartmentExists(id);

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        status: dto.status
      }
    });

    return successResponse(this.toDepartmentResponse(department));
  }

  private buildDepartmentWhere(where: Prisma.DepartmentWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.DepartmentWhereInput;
  }

  private buildUserWhere(where: Prisma.UserWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.UserWhereInput;
  }

  private async validateDepartmentHierarchy(
    parentId: number | null,
    currentId?: number,
    tx: Pick<PrismaService, 'department'> = this.prisma
  ) {
    const departments = await tx.department.findMany({
      where: this.buildDepartmentWhere(),
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    this.assertDepartmentHierarchy(parentId, departments, currentId);
  }

  private assertDepartmentHierarchy(
    parentId: number | null,
    departments: Array<{ id: number; parentId: number | null }>,
    currentId?: number
  ) {
    if (parentId === null) {
      return;
    }

    if (currentId !== undefined && parentId === currentId) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID
      );
    }

    const parent = departments.find((item) => item.id === parentId);
    if (!parent) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    if (currentId !== undefined) {
      const descendantIds = new Set(
        this.collectDepartmentIds(currentId, departments)
      );
      if (descendantIds.has(parentId)) {
        throw new BusinessException(
          BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID
        );
      }
    }
  }

  private async ensureDepartmentExists(id: number) {
    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentWhere({ id })
    });
    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }
    return department;
  }

  private async ensureDepartmentCodeAvailable(
    code: string,
    excludeId?: number,
    tx: Pick<PrismaService, 'department'> = this.prisma
  ) {
    const department = await tx.department.findFirst({
      where: this.buildDepartmentWhere({
        code,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private collectDepartmentIds(
    rootId: number,
    rows: Array<{ id: number; parentId: number | null }>
  ) {
    const ids = [rootId];
    const visited = new Set<number>(ids);
    const walk = (parentId: number) => {
      rows
        .filter((item) => item.parentId === parentId)
        .forEach((item) => {
          if (visited.has(item.id)) {
            return;
          }

          visited.add(item.id);
          ids.push(item.id);
          walk(item.id);
        });
    };
    walk(rootId);
    return ids;
  }

  private buildTree(
    items: Array<ReturnType<DepartmentsService['toDepartmentResponse']>>
  ) {
    const map = new Map<
      number,
      ReturnType<DepartmentsService['toDepartmentResponse']> & {
        children?: Array<
          ReturnType<DepartmentsService['toDepartmentResponse']>
        >;
      }
    >();
    const roots: Array<
      ReturnType<DepartmentsService['toDepartmentResponse']> & {
        children?: Array<
          ReturnType<DepartmentsService['toDepartmentResponse']>
        >;
      }
    > = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    map.forEach((item) => {
      if (!item.pid) {
        roots.push(item);
        return;
      }

      const parent = map.get(item.pid);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots.map((item) => {
      if (!item.children?.length) {
        const { children: _children, ...rest } = item;
        return rest;
      }
      return item;
    });
  }

  private toDepartmentResponse(department: {
    id: number;
    tenantId: string;
    parentId: number | null;
    name: string;
    code: string;
    leader: string | null;
    phone: string | null;
    email: string | null;
    sort: number;
    status: boolean;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      pid: department.parentId ?? 0,
      id: department.id,
      tenantId: department.tenantId,
      name: department.name,
      code: department.code,
      leader: department.leader,
      phone: department.phone,
      email: department.email,
      sort: department.sort,
      status: department.status,
      remark: department.remark,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };
  }

  private toUserResponse(user: UserWithDepartment) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code
          }
        : null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
