import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantAccessService } from '../../modules/tenant/tenants/tenant-access.service';
import { AppConfigService } from '../../shared/config/app-config.service';
import { TenantContextService } from './tenant-context.service';

interface TenantRequestLike {
  header(name: string): string | undefined;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantAccess: TenantAccessService,
    private readonly appConfig: AppConfigService
  ) {}

  async use(request: TenantRequestLike, _response: unknown, next: () => void) {
    const rawTenantId = request.header(this.appConfig.tenantHeader);
    const headerTenantId = rawTenantId?.trim() || null;
    const defaultTenantId = this.appConfig.defaultTenantId;
    const tenantId = headerTenantId ?? defaultTenantId;
    const source = headerTenantId
      ? 'header'
      : defaultTenantId
        ? 'default'
        : 'none';

    return this.tenantContext.run(
      {
        tenantId,
        source
      },
      async () => {
        if (tenantId) {
          await this.tenantAccess.assertActiveTenant(tenantId);
        }

        next();
      }
    );
  }
}
