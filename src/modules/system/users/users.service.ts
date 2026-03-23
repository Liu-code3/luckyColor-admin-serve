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
  ResetUserPasswordDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserListQueryDto
} from './users.dto';

type UserWithDepartment = Prisma.UserGetPayload<{
  include: {
    department: true;
  };
}>;

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
    const username = dto.username.trim();
    const nickname = this.normalizeOptionalString(dto.nickname) ?? username;
    const phone = this.normalizeOptionalString(dto.phone);
    const email = this.normalizeOptionalString(dto.email);
    const avatar = this.normalizeOptionalString(dto.avatar);

    await this.ensureUsernameAvailable(username);
    await this.ensurePhoneAvailable(phone);
    await this.ensureEmailAvailable(email);
    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    try {
      const user = await this.prisma.user.create({
        data: {
          tenantId: this.tenantScope.resolveRequiredTenantValue(),
          departmentId: dto.departmentId ?? null,
          username,
          password: await this.passwordService.hash(dto.password),
          nickname,
          phone: phone ?? null,
          email: email ?? null,
          avatar: avatar ?? null,
          status: dto.status ?? true
        },
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);

    const username = dto.username?.trim();
    const nickname = this.normalizeOptionalString(dto.nickname);
    const phone = this.normalizeOptionalString(dto.phone);
    const email = this.normalizeOptionalString(dto.email);
    const avatar = this.normalizeOptionalString(dto.avatar);

    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    if (username) {
      await this.ensureUsernameAvailable(username, id);
    }

    if (phone !== undefined) {
      await this.ensurePhoneAvailable(phone, id);
    }

    if (email !== undefined) {
      await this.ensureEmailAvailable(email, id);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          username,
          password: dto.password
            ? await this.passwordService.hash(dto.password)
            : undefined,
          nickname,
          phone,
          email,
          avatar,
          status: dto.status,
          departmentId: dto.departmentId
        },
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.delete({ where: { id } });
    return successResponse(true);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status
      },
      include: {
        department: true
      }
    });

    return successResponse(this.toUserResponse(user));
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto) {
    await this.ensureUserExists(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: await this.passwordService.hash(dto.password)
      }
    });

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
          { nickname: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } }
        ]
      });
    }

    if (query.status !== undefined) {
      filters.push({
        status: query.status
      });
    }

    if (query.departmentId !== undefined) {
      filters.push({
        departmentId: query.departmentId
      });
    }

    const createdAt = this.buildCreatedAtWhere(
      query.createdAtStart,
      query.createdAtEnd
    );
    if (createdAt) {
      filters.push({ createdAt });
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

  private buildCreatedAtWhere(start?: string, end?: string) {
    if (!start && !end) {
      return undefined;
    }

    const where: Prisma.DateTimeFilter = {};

    if (start) {
      where.gte = new Date(start);
    }

    if (end) {
      where.lte = new Date(end);
    }

    return where;
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

  private async ensurePhoneAvailable(phone?: string | null, excludeId?: string) {
    if (phone === undefined || phone === null) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        phone,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async ensureEmailAvailable(email?: string | null, excludeId?: string) {
    if (email === undefined || email === null) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        email,
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

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
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
