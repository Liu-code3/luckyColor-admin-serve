export const tenantPackageSeedData = [
  {
    id: 'pkg_basic',
    name: '基础版套餐',
    code: 'basic',
    status: true,
    maxUsers: 50,
    maxRoles: 20,
    maxMenus: 100,
    featureFlags: {
      watermark: true,
      dictionary: true,
      notices: true
    },
    remark: '默认基础租户套餐'
  }
];
