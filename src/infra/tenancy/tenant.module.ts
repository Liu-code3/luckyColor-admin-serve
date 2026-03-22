import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from '@nestjs/common';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenantContextService } from './tenant-context.service';
import { TenantPrismaScopeService } from './tenant-prisma-scope.service';

@Global()
@Module({
  providers: [
    TenantContextService,
    TenantPrismaScopeService,
    TenantContextMiddleware
  ],
  exports: [TenantContextService, TenantPrismaScopeService]
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL
    });
  }
}
