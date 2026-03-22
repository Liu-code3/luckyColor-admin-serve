import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
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
}
