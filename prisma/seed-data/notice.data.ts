export const noticeSeedData = [
  {
    tenantId: 'tenant_001',
    title: '租户开通指引',
    content: '租户创建完成后，请先配置管理员账号、部门与角色权限。',
    type: 'system',
    status: true,
    publisher: '系统管理员',
    publishedAt: new Date('2026-03-22T08:00:00.000Z')
  },
  {
    tenantId: 'tenant_001',
    title: '版本更新提醒',
    content: '本周将上线多租户配置中心，请提前关注菜单与权限变更。',
    type: 'release',
    status: false,
    publisher: '产品团队',
    publishedAt: null
  }
];
