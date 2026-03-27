export const noticeSeedData = [
  {
    tenantId: 'tenant_001',
    title: 'Tenant Onboarding Guide',
    content:
      'Finish role, menu, and department initialization before inviting members.',
    type: 'system',
    status: true,
    publishScope: 'TENANT_ALL',
    targetDepartmentIds: null,
    targetRoleCodes: null,
    isPinned: true,
    publisher: 'System Admin',
    scheduledPublishAt: null,
    publishedAt: new Date('2026-03-22T08:00:00.000Z'),
    eventKey: 'tenant.onboarding.notice',
    eventPayload: '{"source":"seed"}'
  },
  {
    tenantId: 'tenant_001',
    title: 'Release Update Reminder',
    content:
      'The multi-tenant config center will be rolled out this week. Please review permissions in advance.',
    type: 'release',
    status: false,
    publishScope: 'ROLE',
    targetDepartmentIds: null,
    targetRoleCodes: '|tenant_admin|',
    isPinned: false,
    publisher: 'Product Team',
    scheduledPublishAt: new Date('2026-03-28T08:00:00.000Z'),
    publishedAt: null,
    eventKey: 'release.reminder',
    eventPayload: '{"channel":"dashboard"}'
  }
];
