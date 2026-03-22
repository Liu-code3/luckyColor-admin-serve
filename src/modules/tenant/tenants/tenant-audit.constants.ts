export const TENANT_AUDIT_ACTION_VALUES = [
  'CREATED',
  'STATUS_CHANGED',
  'EXPIRES_AT_CHANGED',
  'PACKAGE_CHANGED',
  'UPDATED'
] as const;

export type TenantAuditAction =
  (typeof TENANT_AUDIT_ACTION_VALUES)[number];
