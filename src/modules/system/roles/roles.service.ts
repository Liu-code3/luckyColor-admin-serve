import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  CreateRoleDto,
  RoleListQueryDto,
  UpdateRoleDto
} from './roles.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: RoleListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { code: { contains: keyword } }
          ]
        }
      : {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
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
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    return successResponse(this.toRoleResponse(role));
  }

  async create(dto: CreateRoleDto) {
    await this.ensureRoleCodeAvailable(dto.code);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        sort: dto.sort ?? 0,
        status: dto.status ?? true,
        remark: dto.remark ?? null
      }
    });

    return successResponse(this.toRoleResponse(role));
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.ensureRoleExists(id);

    if (dto.code) {
      await this.ensureRoleCodeAvailable(dto.code, id);
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        sort: dto.sort,
        status: dto.status,
        remark: dto.remark
      }
    });

    return successResponse(this.toRoleResponse(role));
  }

  async remove(id: string) {
    await this.ensureRoleExists(id);
    await this.prisma.role.delete({ where: { id } });
    return successResponse(true);
  }

  private async ensureRoleExists(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }
    return role;
  }

  private async ensureRoleCodeAvailable(code: string, excludeId?: string) {
    const role = await this.prisma.role.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined
      }
    });

    if (role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private toRoleResponse(role: {
    id: string;
    name: string;
    code: string;
    sort: number;
    status: boolean;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status,
      remark: role.remark,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };
  }
}
