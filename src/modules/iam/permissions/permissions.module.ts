import { Global, Module } from '@nestjs/common';
import { TenantsModule } from '../../tenant/tenants/tenants.module';
import { PermissionGuard } from './permission-guard';

@Global()
@Module({
  imports: [TenantsModule],
  providers: [PermissionGuard],
  exports: [PermissionGuard]
})
export class PermissionsModule {}
