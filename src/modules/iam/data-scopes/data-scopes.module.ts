import { Global, Module } from '@nestjs/common';
import { DepartmentsModule } from '../../system/departments/departments.module';
import { TenantsModule } from '../../tenant/tenants/tenants.module';
import { DataScopeService } from './data-scope.service';

@Global()
@Module({
  imports: [DepartmentsModule, TenantsModule],
  providers: [DataScopeService],
  exports: [DataScopeService]
})
export class DataScopesModule {}
