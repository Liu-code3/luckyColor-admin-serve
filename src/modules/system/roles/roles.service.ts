import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import { normalizePermissionCode } from '../../iam/permissions/permission-code.util';
import {
  ROLE_DATA_SCOPE_ALL,
  ROLE_DATA_SCOPE_CUSTOM
} from '../../../shared/constants/access.constants';
import {
  AssignRoleDataScopeDto,
  AssignRoleMenusDto,
  CreateRoleDto,
  RoleListQueryDto,
  UpdateRoleStatusDto,
  UpdateRoleDto
} from './roles.dto';
import { type RoleDataScope } from './roles.constants';

type RoleWithDataScope = Prisma.RoleGetPayload<{
  include: {
    dataScopeDepartments: {
      include: {
        department: true;
      };
    };
  };
}>;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async list(query: RoleListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const filters: Prisma.RoleWhereInput[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { name: { contains: keyword } },
          { code: { contains: keyword } }
        ]
      });
    }

    if (query.status !== undefined) {
      filters.push({
        status: query.status
      });
    }

    const where = this.buildRoleWhere(
      filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0]
          : { AND: filters }
    );

    const [total, records] = await this.prisma.$transaction([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        include: {
          dataScopeDepartments: {
            include: {
              department: true
            }
          }
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toRoleResponse(item))
    });
  }

  async detail(id: string) {
    const role = await this.findRoleWithDataScope(id);
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    return successResponse(this.toRoleResponse(role));
  }

  async create(dto: CreateRoleDto) {
    await this.ensureRoleCodeAvailable(dto.code);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.create({
          data: this.tenantScope.buildRequiredData({
            name: dto.name,
            code: dto.code,
            sort: dto.sort ?? 0,
            status: dto.status ?? true,
            dataScope: dto.dataScope ?? ROLE_DATA_SCOPE_ALL,
            remark: dto.remark ?? null
          })
        });

        await this.syncDataScope(
          tx,
          role.id,
          dto.dataScope ?? ROLE_DATA_SCOPE_ALL,
          dto.dataScopeDeptIds
        );

        const created = await this.findRoleWithDataScope(role.id, tx);
        return successResponse(this.toRoleResponse(created!));
      });
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['tenant_id', 'code']);
    }
  }

  async update(id: string, dto: UpdateRoleDto) {
    const existing = await this.findRoleWithDataScope(id);
    if (!existing) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    if (dto.code) {
      await this.ensureRoleCodeAvailable(dto.code, id);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id },
          data: {
            name: dto.name,
            code: dto.code,
            sort: dto.sort,
            status: dto.status,
            dataScope: dto.dataScope,
            remark: dto.remark
          }
        });

        if (dto.dataScope !== undefined || dto.dataScopeDeptIds !== undefined) {
          await this.syncDataScope(
            tx,
            id,
            dto.dataScope ?? (existing.dataScope as RoleDataScope),
            dto.dataScopeDeptIds ?? this.extractDepartmentIds(existing)
          );
        }

        const updated = await this.findRoleWithDataScope(id, tx);
        return successResponse(this.toRoleResponse(updated!));
      });
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['tenant_id', 'code']);
    }
  }

  async remove(id: string) {
    await this.ensureRoleExists(id);
    await this.prisma.role.delete({ where: { id } });
    return successResponse(true);
  }

  async updateStatus(id: string, dto: UpdateRoleStatusDto) {
    await this.ensureRoleExists(id);

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        status: dto.status
      }
    });

    const updated = await this.findRoleWithDataScope(role.id);
    return successResponse(this.toRoleResponse(updated!));
  }

  async menus(id: string) {
    const role = await this.prisma.role.findFirst({
      where: this.buildRoleWhere({ id }),
      include: {
        menus: {
          include: {
            menu: true
          }
        }
      }
    });
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    return successResponse(
      this.toRoleMenuAssignmentResponse(
        role,
        role.menus
          .map((item) => item.menu)
          .sort((left, right) => left.sort - right.sort || left.id - right.id)
      )
    );
  }

  async assignMenus(id: string, dto: AssignRoleMenusDto) {
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: this.buildRoleWhere({ id })
      });
      if (!role) {
        throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
      }

      const menus =
        dto.menuIds.length > 0
          ? await tx.menu.findMany({
              where: {
                id: { in: dto.menuIds }
              },
              orderBy: [{ sort: 'asc' }, { id: 'asc' }]
            })
          : [];

      if (menus.length !== dto.menuIds.length) {
        throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
      }

      await tx.roleMenu.deleteMany({
        where: this.buildRoleMenuWhere({ roleId: id })
      });

      if (dto.menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: dto.menuIds.map((menuId) =>
            this.tenantScope.buildRequiredData({
              roleId: id,
              menuId
            })
          )
        });
      }

      await this.syncRolePermissions(tx, id, menus);

      return successResponse(this.toRoleMenuAssignmentResponse(role, menus));
    });
  }

  async dataScope(id: string) {
    const role = await this.findRoleWithDataScope(id);
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    return successResponse(this.toRoleDataScopeResponse(role));
  }

  async assignDataScope(id: string, dto: AssignRoleDataScopeDto) {
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: this.buildRoleWhere({ id })
      });
      if (!role) {
        throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
      }

      await tx.role.update({
        where: { id },
        data: {
          dataScope: dto.dataScope
        }
      });

      await this.syncDataScope(
        tx,
        id,
        dto.dataScope,
        dto.departmentIds
      );

      const updated = await this.findRoleWithDataScope(id, tx);
      return successResponse(this.toRoleDataScopeResponse(updated!));
    });
  }

  private buildRoleWhere(where: Prisma.RoleWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RoleWhereInput;
  }

  private buildRoleMenuWhere(where: Prisma.RoleMenuWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RoleMenuWhereInput;
  }

  private buildRolePermissionWhere(where: Prisma.RolePermissionWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RolePermissionWhereInput;
  }

  private buildRoleDepartmentScopeWhere(
    where: Prisma.RoleDepartmentScopeWhereInput = {}
  ) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RoleDepartmentScopeWhereInput;
  }

  private async syncDataScope(
    tx: Pick<PrismaService, 'department' | 'roleDepartmentScope'>,
    roleId: string,
    dataScope: RoleDataScope,
    departmentIds: number[] = []
  ) {
    const uniqueDepartmentIds = Array.from(new Set(departmentIds));

    if (
      dataScope === ROLE_DATA_SCOPE_CUSTOM &&
      uniqueDepartmentIds.length === 0
    ) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
      );
    }

    const departments =
      uniqueDepartmentIds.length > 0
        ? await tx.department.findMany({
            where: this.tenantScope.buildRequiredWhere(
              {
                id: { in: uniqueDepartmentIds }
              },
              'tenantId'
            ) as Prisma.DepartmentWhereInput,
            orderBy: [{ sort: 'asc' }, { id: 'asc' }]
          })
        : [];

    if (departments.length !== uniqueDepartmentIds.length) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    if (
      dataScope !== ROLE_DATA_SCOPE_CUSTOM &&
      uniqueDepartmentIds.length > 0
    ) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
      );
    }

    await tx.roleDepartmentScope.deleteMany({
      where: this.buildRoleDepartmentScopeWhere({ roleId })
    });

    if (dataScope === ROLE_DATA_SCOPE_CUSTOM) {
      await tx.roleDepartmentScope.createMany({
        data: uniqueDepartmentIds.map((departmentId) =>
          this.tenantScope.buildRequiredData({
            roleId,
            departmentId
          })
        )
      });
    }
  }

  private async syncRolePermissions(
    tx: Pick<Prisma.TransactionClient, 'rolePermission'>,
    roleId: string,
    menus: Prisma.MenuGetPayload<Record<string, never>>[]
  ) {
    const permissionCodes = Array.from(
      new Set(
        menus.map((menu) =>
          normalizePermissionCode(menu.permissionCode, menu.menuKey)
        )
      )
    );

    await tx.rolePermission.deleteMany({
      where: this.buildRolePermissionWhere({ roleId })
    });

    if (permissionCodes.length === 0) {
      return;
    }

    await tx.rolePermission.createMany({
      data: permissionCodes.map((permissionCode) =>
        this.tenantScope.buildRequiredData({
          roleId,
          permissionCode
        })
      )
    });
  }

  private findRoleWithDataScope(
    id: string,
    tx: Pick<PrismaService, 'role'> = this.prisma
  ) {
    return tx.role.findFirst({
      where: this.buildRoleWhere({ id }),
      include: {
        dataScopeDepartments: {
          include: {
            department: true
          },
          orderBy: {
            departmentId: 'asc'
          }
        }
      }
    });
  }

  private async ensureRoleExists(id: string) {
    const role = await this.prisma.role.findFirst({
      where: this.buildRoleWhere({ id })
    });
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }
    return role;
  }

  private async ensureRoleCodeAvailable(code: string, excludeId?: string) {
    const role = await this.prisma.role.findFirst({
      where: this.buildRoleWhere({
        code,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private extractDepartmentIds(role: {
    dataScopeDepartments: Array<{
      departmentId: number;
    }>;
  }) {
    return role.dataScopeDepartments.map((item) => item.departmentId);
  }

  private toRoleResponse(
    role: Prisma.RoleGetPayload<{
      include: {
        dataScopeDepartments: true;
      };
    }>
  ) {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status,
      dataScope: role.dataScope,
      dataScopeDeptIds: this.extractDepartmentIds(role),
      remark: role.remark,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };
  }

  private toAssignedMenuResponse(
    menu: Prisma.MenuGetPayload<Record<string, never>>
  ) {
    return {
      id: menu.id,
      pid: menu.parentId ?? 0,
      title: menu.title,
      name: menu.name,
      type: menu.type,
      path: menu.path,
      key: menu.menuKey,
      permissionCode: normalizePermissionCode(
        menu.permissionCode,
        menu.menuKey
      ),
      isVisible: menu.isVisible,
      sort: menu.sort
    };
  }

  private toRoleMenuAssignmentResponse(
    role: {
      id: string;
      tenantId: string;
      name: string;
      code: string;
    },
    menus: Prisma.MenuGetPayload<Record<string, never>>[]
  ) {
    return {
      roleId: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      menuIds: menus.map((item) => item.id),
      menus: menus.map((item) => this.toAssignedMenuResponse(item))
    };
  }

  private toRoleDataScopeResponse(role: RoleWithDataScope) {
    const departments = role.dataScopeDepartments
      .map((item) => item.department)
      .sort((left, right) => left.sort - right.sort || left.id - right.id);

    return {
      roleId: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      dataScope: role.dataScope,
      departmentIds: departments.map((item) => item.id),
      departments: departments.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        pid: item.parentId ?? 0,
        name: item.name,
        code: item.code
      }))
    };
  }
}
