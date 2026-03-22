import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantPackageListQueryDto } from './tenant-packages.dto';

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
    const tenantPackage = await this.prisma.tenantPackage.findUnique({
      where: { id }
    });
    if (!tenantPackage) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      );
    }

    return successResponse(this.toPackageResponse(tenantPackage));
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
