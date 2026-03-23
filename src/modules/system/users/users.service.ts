import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { DataScopeService } from '../../iam/data-scopes/data-scope.service';
import {
  AssignUserRolesDto,
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly passwordService: PasswordService,
    private readonly dataScopeService: DataScopeService
  ) {}

  async list(user: JwtPayload, query: UserListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const scopedWhere = await this.dataScopeService.buildUserWhere(
      user,
      this.buildUserListWhere(query, keyword)
    );
    const where = this.buildUserWhere(scopedWhere);

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

  async detail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id }),
      include: {
        department: true
      }
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(this.toUserResponse(user));
  }

  async create(dto: CreateUserDto) {
    await this.ensureUsernameAvailable(dto.username);
    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    try {
      const user = await this.prisma.user.create({
        data: {
          tenantId: this.tenantScope.resolveRequiredTenantValue(),
          username: dto.username,
          password: await this.passwordService.hash(dto.password),
          nickname: dto.nickname?.trim() || dto.username,
          departmentId: dto.departmentId ?? null
        },
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, [
        'tenant_id',
        'username'
      ]);
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);
    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    if (dto.username) {
      await this.ensureUsernameAvailable(dto.username, id);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          username: dto.username,
          password: dto.password
            ? await this.passwordService.hash(dto.password)
            : undefined,
          nickname: dto.nickname,
          departmentId: dto.departmentId
        },
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, [
        'tenant_id',
        'username'
      ]);
    }
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.delete({ where: { id } });
    return successResponse(true);
  }

  async roles(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id }),
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(
      this.toUserRoleAssignmentResponse(
        user,
        user.roles
          .map((item) => item.role)
          .sort((left, right) => left.sort - right.sort)
      )
    );
  }

  async assignRoles(id: string, dto: AssignUserRolesDto) {
    const tenantId = this.tenantScope.requireTenantId();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: this.buildUserWhere({ id })
      });
      if (!user) {
        throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
      }

      const roles =
        dto.roleIds.length > 0
          ? await tx.role.findMany({
              where: this.buildRoleWhere({
                id: { in: dto.roleIds }
              }),
              orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
            })
          : [];

      if (roles.length !== dto.roleIds.length) {
        throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
      }

      await tx.userRole.deleteMany({
        where: {
          userId: id,
          tenantId
        }
      });

      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
            tenantId
          }))
        });
      }

      return successResponse(this.toUserRoleAssignmentResponse(user, roles));
    });
  }

  private buildUserWhere(where: Prisma.UserWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.UserWhereInput;
  }

  private buildRoleWhere(where: Prisma.RoleWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RoleWhereInput;
  }

  private buildDepartmentWhere(where: Prisma.DepartmentWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.DepartmentWhereInput;
  }

  private buildUserListWhere(query: UserListQueryDto, keyword?: string) {
    const filters: Prisma.UserWhereInput[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { username: { contains: keyword } },
          { nickname: { contains: keyword } }
        ]
      });
    }

    if (query.departmentId !== undefined) {
      filters.push({
        departmentId: query.departmentId
      });
    }

    if (!filters.length) {
      return undefined;
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return {
      AND: filters
    };
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id })
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  }

  private async ensureUsernameAvailable(username: string, excludeId?: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        username,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async ensureDepartmentBelongsToTenant(departmentId?: number | null) {
    if (departmentId === undefined) {
      return null;
    }

    if (departmentId === null) {
      return null;
    }

    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentWhere({ id: departmentId })
    });

    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return department;
  }

  private toUserResponse(user: {
    id: string;
    tenantId: string;
    departmentId?: number | null;
    username: string;
    nickname: string | null;
    department?: {
      id: number;
      name: string;
      code: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      username: user.username,
      nickname: user.nickname,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private toAssignedRoleResponse(
    role: Prisma.RoleGetPayload<Record<string, never>>
  ) {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status
    };
  }

  private toUserRoleAssignmentResponse(
    user: {
      id: string;
      tenantId: string;
      username: string;
      nickname: string | null;
    },
    roles: Prisma.RoleGetPayload<Record<string, never>>[]
  ) {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
      nickname: user.nickname,
      roleIds: roles.map((item) => item.id),
      roles: roles.map((item) => this.toAssignedRoleResponse(item))
    };
  }
}
