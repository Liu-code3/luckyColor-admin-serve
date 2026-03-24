export const TENANT_STATUS_ACTIVE = 'ACTIVE';
export const TENANT_STATUS_DISABLED = 'DISABLED';
export const TENANT_STATUS_FROZEN = 'FROZEN';

export const TENANT_STATUS_VALUES = [
  TENANT_STATUS_ACTIVE,
  TENANT_STATUS_DISABLED,
  TENANT_STATUS_FROZEN
] as const;

export type TenantStatus = (typeof TENANT_STATUS_VALUES)[number];

export const NOTICE_STATUS_DRAFT = false;
export const NOTICE_STATUS_PUBLISHED = true;

export const NOTICE_STATUS_VALUES = [
  NOTICE_STATUS_DRAFT,
  NOTICE_STATUS_PUBLISHED
] as const;

export type NoticeStatus = (typeof NOTICE_STATUS_VALUES)[number];
