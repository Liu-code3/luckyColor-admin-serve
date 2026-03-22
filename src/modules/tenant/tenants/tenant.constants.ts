export const TENANT_STATUS_VALUES = ['ACTIVE', 'DISABLED', 'FROZEN'] as const;

export type TenantStatus = (typeof TENANT_STATUS_VALUES)[number];
