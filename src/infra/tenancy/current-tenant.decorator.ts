import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  TenantContextSource,
  TenantContextStore,
  TenantRequestLike
} from './tenant-context.types';

type CurrentTenantField = keyof TenantContextStore | undefined;

const EMPTY_TENANT_CONTEXT: TenantContextStore = {
  tenantId: null,
  source: 'none'
};

export const CurrentTenant = createParamDecorator(
  (
    field: CurrentTenantField,
    ctx: ExecutionContext
  ): TenantContextStore | string | null | TenantContextSource => {
    const request = ctx.switchToHttp().getRequest<TenantRequestLike>();
    const tenantContext = request.tenantContext ?? EMPTY_TENANT_CONTEXT;

    if (!field) {
      return tenantContext;
    }

    return tenantContext[field];
  }
);
