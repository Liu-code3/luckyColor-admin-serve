import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextStore {
  tenantId: string | null;
  source: 'header' | 'domain' | 'token' | 'default' | 'none';
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContextStore>();

  run<T>(store: TenantContextStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  getStore() {
    return this.storage.getStore();
  }

  getTenantId() {
    return this.storage.getStore()?.tenantId ?? null;
  }

  hasTenant() {
    return !!this.getTenantId();
  }

  setTenant(
    tenantId: string | null,
    source: TenantContextStore['source'] = tenantId ? 'token' : 'none'
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
