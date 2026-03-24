export type TenantContextSource =
  | 'header'
  | 'domain'
  | 'token'
  | 'default'
  | 'none';

export interface TenantContextStore {
  tenantId: string | null;
  source: TenantContextSource;
}

export interface TenantRequestLike {
  header(name: string): string | undefined;
  hostname?: string;
  tenantContext?: TenantContextStore;
}
