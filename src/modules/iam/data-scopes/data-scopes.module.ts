import { Global, Module } from '@nestjs/common';
import { DepartmentsModule } from '../../system/departments/departments.module';
import { DataScopeService } from './data-scope.service';

@Global()
@Module({
  imports: [DepartmentsModule],
  providers: [DataScopeService],
  exports: [DataScopeService]
})
export class DataScopesModule {}
