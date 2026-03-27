import { Module } from '@nestjs/common';
import { PermissionsModule } from '../../iam/permissions/permissions.module';
import { TenantPackagesController } from './tenant-packages.controller';
import { TenantPackagesService } from './tenant-packages.service';

@Module({
  imports: [PermissionsModule],
  controllers: [TenantPackagesController],
  providers: [TenantPackagesService],
  exports: [TenantPackagesService]
})
export class TenantPackagesModule {}
