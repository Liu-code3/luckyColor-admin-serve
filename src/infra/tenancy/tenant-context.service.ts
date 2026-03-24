import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';
import type {
  TenantContextSource,
  TenantContextStore
} from './tenant-context.types';

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextStore>();

  run<T>(store: TenantContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  getStore() {
    return this.storage.getStore();
  }

  getSnapshot(): TenantContextStore {
    return this.storage.getStore() ?? {
      tenantId: null,
      source: 'none'
    };
  }

  getTenantId() {
    return this.getSnapshot().tenantId;
  }

  getSource(): TenantContextSource {
    return this.getSnapshot().source;
  }

  hasTenant() {
    return !!this.getTenantId();
  }

  requireTenant() {
    const snapshot = this.getSnapshot();
    if (!snapshot.tenantId) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED);
    }

    return snapshot;
  }

  setTenant(
    tenantId: string | null,
    source: TenantContextSource = tenantId ? 'token' : 'none'
  ) {
    const store = this.storage.getStore();
    if (store) {
      store.tenantId = tenantId;
      store.source = source;
      return;
    }

    this.storage.enterWith({
      tenantId,
      source
    });
  }
}
