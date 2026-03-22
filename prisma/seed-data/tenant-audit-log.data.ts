export const tenantAuditLogSeedData = [
  {
    id: 'tenant_audit_default_created',
    tenantId: 'tenant_001',
    action: 'CREATED',
    operatorTenantId: null,
    operatorUserId: null,
    detail: {
      source: 'seed',
      packageCode: 'basic',
      adminUsername: 'admin'
    },
    createdAt: new Date('2026-03-22T14:30:00.000Z')
  }
];
