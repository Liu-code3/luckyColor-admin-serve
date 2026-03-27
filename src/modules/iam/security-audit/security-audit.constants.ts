export const SECURITY_AUDIT_EVENT_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const;

export const SECURITY_AUDIT_OUTCOMES = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  DENIED: 'DENIED'
} as const;

export type SecurityAuditEventType =
  (typeof SECURITY_AUDIT_EVENT_TYPES)[keyof typeof SECURITY_AUDIT_EVENT_TYPES];

export type SecurityAuditOutcome =
  (typeof SECURITY_AUDIT_OUTCOMES)[keyof typeof SECURITY_AUDIT_OUTCOMES];
