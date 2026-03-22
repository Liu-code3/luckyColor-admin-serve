import { Injectable, NestMiddleware } from '@nestjs/common';
import { TENANT_ID_HEADER } from './tenant.constants';
import { TenantContextService } from './tenant-context.service';

interface TenantRequestLike {
  header(name: string): string | undefined;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(request: TenantRequestLike, _response: unknown, next: () => void) {
    const rawTenantId = request.header(TENANT_ID_HEADER);
    const tenantId = rawTenantId?.trim() || null;

    this.tenantContext.run(
      {
        tenantId,
        source: tenantId ? 'header' : 'none'
      },
      next
    );
  }
}
