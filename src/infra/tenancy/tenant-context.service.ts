import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextStore {
  tenantId: string | null;
  source: 'header' | 'none';
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
}
