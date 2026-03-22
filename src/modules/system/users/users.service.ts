import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { CreateUserDto, UpdateUserDto, UserListQueryDto } from './users.dto';

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

    return successResponse(
      {
        total,
        current,
        size,
        records: records.map((item) => this.toUserResponse(item))
      },
      '获取用户列表成功'
    );
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return successResponse(this.toUserResponse(user), '获取用户详情成功');
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: dto.password,
        nickname: dto.nickname?.trim() || dto.username
      }
    });

    return successResponse(this.toUserResponse(user), '创建用户成功');
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

    return successResponse(this.toUserResponse(user), '更新用户成功');
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.delete({ where: { id } });
    return successResponse(true, '删除用户成功');
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
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
}
