import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { resolveSortOrder } from '../../../shared/api/list-query.util';
import { TenantAuditService } from './tenant-audit.service';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { CreateTenantDto, TenantListQueryDto, UpdateTenantDto } from './tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantBootstrap: TenantBootstrapService,
    private readonly tenantAudit: TenantAuditService
  ) {}

  async list(query: TenantListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where: Prisma.TenantWhereInput = {
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
    const orderBy = this.buildListOrderBy(query);

    const [total, records] = await this.prisma.$transaction([
      this.prisma.tenant.count({ where }),
      this.prisma.tenant.findMany({
        where,
        include: {
          tenantPackage: true
        },
        orderBy,
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toTenantResponse(item))
    });
  }

  async detail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantPackage: true
      }
    });
    if (!tenant) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND);
    }

    return successResponse(this.toTenantResponse(tenant));
  }

  async create(dto: CreateTenantDto) {
    const result = await this.tenantBootstrap.initializeTenant(dto);

    return successResponse({
      tenant: this.toTenantResponse(result.tenant),
      adminUser: {
        id: result.adminUser.id,
        username: result.adminUser.username,
        nickname: result.adminUser.nickname
      },
      roles: result.roles.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name
      })),
      departments: result.departments.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name
      })),
      menuIds: result.menuIds,
      dictionaryIds: result.dictionaryIds
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantPackage: true
      }
    });

    if (!existing) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND);
    }

    const nextPackage =
      dto.packageId === undefined
        ? existing.tenantPackage
        : await this.resolveTenantPackage(dto.packageId);

    return this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id },
        data: {
          name: dto.name,
          status: dto.status,
          expiresAt:
            dto.expiresAt === undefined
              ? undefined
              : dto.expiresAt
                ? new Date(dto.expiresAt)
                : null,
          contactName:
            dto.contactName === undefined ? undefined : dto.contactName ?? null,
          contactPhone:
            dto.contactPhone === undefined
              ? undefined
              : dto.contactPhone ?? null,
          contactEmail:
            dto.contactEmail === undefined
              ? undefined
              : dto.contactEmail ?? null,
          packageId:
            dto.packageId === undefined ? undefined : nextPackage?.id ?? null,
          remark: dto.remark === undefined ? undefined : dto.remark ?? null
        }
      });

      const updated = await tx.tenant.findUnique({
        where: { id },
        include: {
          tenantPackage: true
        }
      });

      await this.tenantAudit.recordMany(
        this.buildAuditEntries(existing, updated!),
        tx
      );

      return successResponse(this.toTenantResponse(updated!));
    });
  }

  private async resolveTenantPackage(packageId: string) {
    const tenantPackage = await this.prisma.tenantPackage.findUnique({
      where: { id: packageId }
    });

    if (!tenantPackage) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND);
    }

    if (!tenantPackage.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED);
    }

    return tenantPackage;
  }

  private buildListOrderBy(
    query: TenantListQueryDto
  ): Prisma.TenantOrderByWithRelationInput[] {
    const sortOrder = resolveSortOrder(query.sortOrder);

    switch (query.sortBy) {
      case 'name':
        return [{ name: sortOrder }, { createdAt: 'desc' }];
      case 'code':
        return [{ code: sortOrder }, { createdAt: 'desc' }];
      case 'status':
        return [{ status: sortOrder }, { createdAt: 'desc' }];
      case 'expiresAt':
        return [{ expiresAt: sortOrder }, { createdAt: 'desc' }];
      case 'updatedAt':
        return [{ updatedAt: sortOrder }, { createdAt: 'desc' }];
      case 'createdAt':
      default:
        return [{ createdAt: sortOrder }];
    }
  }

  private buildAuditEntries(
    previous: Prisma.TenantGetPayload<{
      include: {
        tenantPackage: true;
      };
    }>,
    current: Prisma.TenantGetPayload<{
      include: {
        tenantPackage: true;
      };
    }>
  ) {
    const entries: Array<{
      tenantId: string;
      action:
        | 'STATUS_CHANGED'
        | 'EXPIRES_AT_CHANGED'
        | 'PACKAGE_CHANGED'
        | 'UPDATED';
      detail: Prisma.InputJsonValue;
    }> = [];

    if (previous.status !== current.status) {
      entries.push({
        tenantId: current.id,
        action: 'STATUS_CHANGED',
        detail: {
          field: 'status',
          before: previous.status,
          after: current.status
        }
      });
    }

    if (!this.isSameDate(previous.expiresAt, current.expiresAt)) {
      entries.push({
        tenantId: current.id,
        action: 'EXPIRES_AT_CHANGED',
        detail: {
          field: 'expiresAt',
          before: previous.expiresAt?.toISOString() ?? null,
          after: current.expiresAt?.toISOString() ?? null
        }
      });
    }

    if (previous.packageId !== current.packageId) {
      entries.push({
        tenantId: current.id,
        action: 'PACKAGE_CHANGED',
        detail: {
          before: previous.tenantPackage
            ? {
                id: previous.tenantPackage.id,
                code: previous.tenantPackage.code,
                name: previous.tenantPackage.name
              }
            : null,
          after: current.tenantPackage
            ? {
                id: current.tenantPackage.id,
                code: current.tenantPackage.code,
                name: current.tenantPackage.name
              }
            : null
        }
      });
    }

    const changedFields = [
      this.toChangedField('name', previous.name, current.name),
      this.toChangedField(
        'contactName',
        previous.contactName ?? null,
        current.contactName ?? null
      ),
      this.toChangedField(
        'contactPhone',
        previous.contactPhone ?? null,
        current.contactPhone ?? null
      ),
      this.toChangedField(
        'contactEmail',
        previous.contactEmail ?? null,
        current.contactEmail ?? null
      ),
      this.toChangedField('remark', previous.remark ?? null, current.remark ?? null)
    ].filter((item): item is { field: string; before: string | null; after: string | null } =>
      item !== null
    );

    if (changedFields.length > 0) {
      entries.push({
        tenantId: current.id,
        action: 'UPDATED',
        detail: {
          fields: changedFields
        }
      });
    }

    return entries;
  }

  private toChangedField(
    field: string,
    previous: string | null,
    current: string | null
  ) {
    if (previous === current) {
      return null;
    }

    return {
      field,
      before: previous,
      after: current
    };
  }

  private isSameDate(left: Date | null, right: Date | null) {
    if (!left && !right) {
      return true;
    }

    if (!left || !right) {
      return false;
    }

    return left.getTime() === right.getTime();
  }

  private toTenantResponse(
    tenant: Prisma.TenantGetPayload<{
      include: {
        tenantPackage: true;
      };
    }>
  ) {
    return {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      status: tenant.status,
      expiresAt: tenant.expiresAt,
      contactName: tenant.contactName,
      contactPhone: tenant.contactPhone,
      contactEmail: tenant.contactEmail,
      tenantPackage: tenant.tenantPackage
        ? {
            id: tenant.tenantPackage.id,
            code: tenant.tenantPackage.code,
            name: tenant.tenantPackage.name,
            status: tenant.tenantPackage.status
          }
        : null,
      remark: tenant.remark,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }
}
