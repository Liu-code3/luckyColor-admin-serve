import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  AssignUserRolesDto,
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UserListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { nickname: { contains: keyword } }
          ]
        }
      : {};

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
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(this.toUserResponse(user));
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: dto.password,
        nickname: dto.nickname?.trim() || dto.username
      }
    });

    return successResponse(this.toUserResponse(user));
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username,
        password: dto.password,
        nickname: dto.nickname
      }
    });

    return successResponse(this.toUserResponse(user));
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.delete({ where: { id } });
    return successResponse(true);
  }

  async roles(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) {
        throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
      }

      const roles =
        dto.roleIds.length > 0
          ? await tx.role.findMany({
              where: {
                id: { in: dto.roleIds }
              },
              orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
            })
          : [];

      if (roles.length !== dto.roleIds.length) {
        throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
      }

      await tx.userRole.deleteMany({
        where: { userId: id }
      });

      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: id,
            roleId
          }))
        });
      }

      return successResponse(this.toUserRoleAssignmentResponse(user, roles));
    });
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  }

  private toUserResponse(user: {
    id: string;
    username: string;
    nickname: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
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
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status
    };
  }

  private toUserRoleAssignmentResponse(
    user: {
      id: string;
      username: string;
      nickname: string | null;
    },
    roles: Prisma.RoleGetPayload<Record<string, never>>[]
  ) {
    return {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      roleIds: roles.map((item) => item.id),
      roles: roles.map((item) => this.toAssignedRoleResponse(item))
    };
  }
}
