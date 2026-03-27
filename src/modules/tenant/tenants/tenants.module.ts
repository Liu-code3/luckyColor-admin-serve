import { Global, Module } from '@nestjs/common';
import { TenantAccessService } from './tenant-access.service';
import { TenantActorService } from './tenant-actor.service';
import { TenantAuditService } from './tenant-audit.service';
import { TenantBootstrapService } from './tenant-bootstrap.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Global()
@Module({
  controllers: [TenantsController],
  providers: [
    TenantsService,
    TenantAccessService,
    TenantActorService,
    TenantAuditService,
    TenantBootstrapService
  ],
  exports: [
    TenantsService,
    TenantAccessService,
    TenantActorService,
    TenantAuditService,
    TenantBootstrapService
  ]
})
export class TenantsModule {}
