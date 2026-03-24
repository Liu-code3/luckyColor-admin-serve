import { Module } from '@nestjs/common';
import { TenantsModule } from '../../tenant/tenants/tenants.module';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  imports: [TenantsModule],
  controllers: [MenusController],
  providers: [MenusService]
})
export class MenusModule {}
