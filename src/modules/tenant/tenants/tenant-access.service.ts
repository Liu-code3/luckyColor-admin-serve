import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  TENANT_STATUS_ACTIVE,
  TENANT_STATUS_DISABLED,
  TENANT_STATUS_FROZEN,
  type TenantStatus
} from '../../../shared/constants/status.constants';

@Injectable()
export class TenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantPackage: true
      }
    });
  }

  findByCode(code: string) {
    return this.prisma.tenant.findUnique({
      where: { code },
      include: {
        tenantPackage: true
      }
    });
  }

  async assertActiveTenant(id: string) {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND);
    }

    this.assertTenantStatusAccessible(tenant.status as TenantStatus);

    if (tenant.expiresAt && tenant.expiresAt.getTime() < Date.now()) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_EXPIRED);
    }

    return tenant;
  }

  private assertTenantStatusAccessible(status: TenantStatus) {
    if (status === TENANT_STATUS_ACTIVE) {
      return;
    }

    if (status === TENANT_STATUS_DISABLED) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_DISABLED);
    }

    if (status === TENANT_STATUS_FROZEN) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_FROZEN);
    }

    throw new BusinessException(BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED);
  }
}
