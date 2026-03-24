import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';
import { TENANT_GLOBAL_VALUES } from './tenant.constants';
import { TenantContextService } from './tenant-context.service';

interface BuildTenantWhereOptions {
  includeGlobal?: boolean;
  globalValues?: Array<string | null>;
}

@Injectable()
export class TenantPrismaScopeService {
  constructor(private readonly tenantContext: TenantContextService) {}

  getTenantId() {
    return this.tenantContext.getTenantId();
  }

  requireTenantId() {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED);
    }

    return tenantId;
  }

  buildWhere(
    where: Record<string, unknown> | undefined,
    tenantField = 'tenantId',
    options: BuildTenantWhereOptions = {}
  ) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      return where;
    }

    return this.buildWhereForTenant(where, tenantId, tenantField, options);
  }

  resolveTenantValue(value?: string | null) {
    return this.tenantContext.getTenantId() ?? value ?? null;
  }

  buildRequiredWhere(
    where: Record<string, unknown> | undefined,
    tenantField = 'tenantId'
  ) {
    const tenantId = this.requireTenantId();
    return this.buildWhereForTenant(where, tenantId, tenantField);
  }

  resolveRequiredTenantValue() {
    return this.requireTenantId();
  }

  buildWhereForTenant(
    where: Record<string, unknown> | undefined,
    tenantId: string,
    tenantField = 'tenantId',
    options: BuildTenantWhereOptions = {}
  ) {
    const tenantWhere = this.createTenantConstraint(
      tenantField,
      tenantId,
      options
    );

    if (!where || Object.keys(where).length === 0) {
      return tenantWhere;
    }

    return {
      AND: [where, tenantWhere]
    };
  }

  buildDataForTenant<
    T extends Record<string, unknown>,
    TTenantField extends string = 'tenantId'
  >(
    data: T,
    tenantId: string,
    tenantField: TTenantField = 'tenantId' as TTenantField
  ) {
    return {
      ...data,
      [tenantField]: tenantId
    } as T & Record<TTenantField, string>;
  }

  buildRequiredData<
    T extends Record<string, unknown>,
    TTenantField extends string = 'tenantId'
  >(
    data: T,
    tenantField: TTenantField = 'tenantId' as TTenantField
  ) {
    return this.buildDataForTenant(data, this.requireTenantId(), tenantField);
  }

  private createTenantConstraint(
    tenantField: string,
    tenantId: string,
    options: BuildTenantWhereOptions
  ) {
    const includeGlobal = options.includeGlobal ?? false;
    const globalValues = options.globalValues ?? [...TENANT_GLOBAL_VALUES];

    if (!includeGlobal) {
      return {
        [tenantField]: tenantId
      };
    }

    return {
      OR: [
        {
          [tenantField]: tenantId
        },
        ...globalValues.map((value) => ({
          [tenantField]: value
        }))
      ]
    };
  }
}
