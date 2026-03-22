import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantAccessService } from '../../modules/tenant/tenants/tenant-access.service';
import { TENANT_ID_HEADER } from './tenant.constants';
import { TenantContextService } from './tenant-context.service';

interface TenantRequestLike {
  header(name: string): string | undefined;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantAccess: TenantAccessService
  ) {}

  async use(request: TenantRequestLike, _response: unknown, next: () => void) {
    const rawTenantId = request.header(TENANT_ID_HEADER);
    const headerTenantId = rawTenantId?.trim() || null;
    const defaultTenantId = process.env.DEFAULT_TENANT_ID?.trim() || null;
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
