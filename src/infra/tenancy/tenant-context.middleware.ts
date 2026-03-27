import { Injectable, NestMiddleware } from '@nestjs/common';
import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';
import { TenantAccessService } from '../../modules/tenant/tenants/tenant-access.service';
import { AppConfigService } from '../../shared/config/app-config.service';
import { TenantContextService } from './tenant-context.service';
import type { TenantRequestLike } from './tenant-context.types';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantAccess: TenantAccessService,
    private readonly appConfig: AppConfigService
  ) {}

  async use(request: TenantRequestLike, _response: unknown, next: () => void) {
    if (!this.appConfig.tenantEnabled) {
      request.tenantContext = {
        tenantId: null,
        source: 'none'
      };

      return this.tenantContext.run(request.tenantContext, async () => {
        next();
      });
    }

    const rawTenantId = request.header(this.appConfig.tenantHeader);
    const headerTenantId = rawTenantId?.trim() || null;
    const domainTenantId = headerTenantId
      ? null
      : await this.resolveTenantIdFromDomain(request);
    const defaultTenantId = this.appConfig.defaultTenantId;
    const tenantId = headerTenantId ?? domainTenantId ?? defaultTenantId;
    const source = headerTenantId
      ? 'header'
      : domainTenantId
        ? 'domain'
      : defaultTenantId
        ? 'default'
        : 'none';
    request.tenantContext = {
      tenantId,
      source
    };

    return this.tenantContext.run(
      request.tenantContext,
      async () => {
        if (tenantId) {
          await this.tenantAccess.assertActiveTenant(tenantId);
        }

        next();
      }
    );
  }

  private async resolveTenantIdFromDomain(request: TenantRequestLike) {
    const suffix = this.appConfig.tenantDomainSuffix;
    if (!suffix) {
      return null;
    }

    const hostname = this.readHostname(request);
    const tenantCode = this.extractTenantCode(hostname, suffix);
    if (!tenantCode) {
      return null;
    }

    const tenant = await this.tenantAccess.findByCode(tenantCode);
    if (!tenant) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND);
    }

    return tenant.id;
  }

  private readHostname(request: TenantRequestLike) {
    const rawHost = request.hostname ?? request.header('host') ?? '';
    return rawHost.trim().toLowerCase().replace(/:\d+$/, '');
  }

  private extractTenantCode(hostname: string, suffix: string) {
    const normalizedSuffix = suffix.trim().toLowerCase();
    if (!hostname || !normalizedSuffix || hostname === normalizedSuffix) {
      return null;
    }

    const domainSuffix = `.${normalizedSuffix}`;
    if (!hostname.endsWith(domainSuffix)) {
      return null;
    }

    const tenantCode = hostname.slice(0, -domainSuffix.length);
    if (!tenantCode || tenantCode.includes('.')) {
      return null;
    }

    return tenantCode;
  }
}
