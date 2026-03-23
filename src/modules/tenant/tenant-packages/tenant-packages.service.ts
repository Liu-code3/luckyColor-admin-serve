import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import {
  CreateTenantPackageDto,
  TenantPackageListQueryDto,
  UpdateTenantPackageDto
} from './tenant-packages.dto';

@Injectable()
export class TenantPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: TenantPackageListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where: Prisma.TenantPackageWhereInput = {
      status: query.status,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { code: { contains: keyword } }
            ]
          }
        : {})
    };

    const [total, records] = await this.prisma.$transaction([
      this.prisma.tenantPackage.count({ where }),
      this.prisma.tenantPackage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toPackageResponse(item))
    });
  }

  async detail(id: string) {
    const tenantPackage = await this.ensurePackageExists(id);
    return successResponse(this.toPackageResponse(tenantPackage));
  }

  async create(dto: CreateTenantPackageDto) {
    try {
      const tenantPackage = await this.prisma.tenantPackage.create({
        data: {
          id: dto.id?.trim() || this.buildTenantPackageId(dto.code),
          code: dto.code,
          name: dto.name,
          status: dto.status ?? true,
          maxUsers: dto.maxUsers,
          maxRoles: dto.maxRoles,
          maxMenus: dto.maxMenus,
          featureFlags:
            (dto.featureFlags as Prisma.InputJsonValue | undefined) ??
            undefined,
          remark: dto.remark ?? null
        }
      });

      return successResponse(this.toPackageResponse(tenantPackage));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async update(id: string, dto: UpdateTenantPackageDto) {
    await this.ensurePackageExists(id);

    try {
      const tenantPackage = await this.prisma.tenantPackage.update({
        where: { id },
        data: {
          code: dto.code,
          name: dto.name,
          status: dto.status,
          maxUsers: dto.maxUsers,
          maxRoles: dto.maxRoles,
          maxMenus: dto.maxMenus,
          featureFlags:
            dto.featureFlags === undefined
              ? undefined
              : (dto.featureFlags as Prisma.InputJsonValue),
          remark: dto.remark === undefined ? undefined : (dto.remark ?? null)
        }
      });

      return successResponse(this.toPackageResponse(tenantPackage));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['code']);
    }
  }

  async remove(id: string) {
    await this.ensurePackageExists(id);

    const tenantCount = await this.prisma.tenant.count({
      where: {
        packageId: id
      }
    });

    if (tenantCount > 0) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_PACKAGE_IN_USE);
    }

    await this.prisma.tenantPackage.delete({
      where: { id }
    });

    return successResponse(true);
  }

  private async ensurePackageExists(id: string) {
    const tenantPackage = await this.prisma.tenantPackage.findUnique({
      where: { id }
    });

    if (!tenantPackage) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      );
    }

    return tenantPackage;
  }

  private buildTenantPackageId(code: string) {
    const normalizedCode = code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (normalizedCode) {
      return `pkg_${normalizedCode}`;
    }

    return `pkg_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  private toPackageResponse(
    tenantPackage: Prisma.TenantPackageGetPayload<Record<string, never>>
  ) {
    return {
      id: tenantPackage.id,
      code: tenantPackage.code,
      name: tenantPackage.name,
      status: tenantPackage.status,
      maxUsers: tenantPackage.maxUsers,
      maxRoles: tenantPackage.maxRoles,
      maxMenus: tenantPackage.maxMenus,
      featureFlags:
        (tenantPackage.featureFlags as Record<string, unknown> | null) ?? null,
      remark: tenantPackage.remark,
      createdAt: tenantPackage.createdAt,
      updatedAt: tenantPackage.updatedAt
    };
  }
}
