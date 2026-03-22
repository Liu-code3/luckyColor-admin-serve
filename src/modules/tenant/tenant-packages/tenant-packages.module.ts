import { Module } from '@nestjs/common';
import { TenantPackagesController } from './tenant-packages.controller';
import { TenantPackagesService } from './tenant-packages.service';

@Module({
  controllers: [TenantPackagesController],
  providers: [TenantPackagesService],
  exports: [TenantPackagesService]
})
export class TenantPackagesModule {}
