import { Injectable } from '@nestjs/common';
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

  buildWhere(
    where: Record<string, unknown> | undefined,
    tenantField = 'tenantId',
    options: BuildTenantWhereOptions = {}
  ) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      return where;
    }

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

  resolveTenantValue(value?: string | null) {
    return this.tenantContext.getTenantId() ?? value ?? null;
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
