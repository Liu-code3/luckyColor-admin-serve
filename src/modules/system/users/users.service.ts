import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
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
    private readonly passwordService: PasswordService
  ) {}

  async list(query: UserListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = this.buildUserWhere(
      keyword
        ? {
            OR: [
              { username: { contains: keyword } },
              { nickname: { contains: keyword } }
            ]
          }
        : undefined
    );

    const [total, records] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
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
      where: this.buildUserWhere({ id })
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(this.toUserResponse(user));
  }

  async create(dto: CreateUserDto) {
    await this.ensureUsernameAvailable(dto.username);

    try {
      const user = await this.prisma.user.create({
        data: {
          tenantId: this.tenantScope.resolveRequiredTenantValue(),
          username: dto.username,
          password: await this.passwordService.hash(dto.password),
          nickname: dto.nickname?.trim() || dto.username
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
          nickname: dto.nickname
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

  private toUserResponse(user: {
    id: string;
    tenantId: string;
    username: string;
    nickname: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      nickname: user.nickname,
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
