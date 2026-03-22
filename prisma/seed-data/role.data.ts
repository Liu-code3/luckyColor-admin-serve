export const roleSeedData = [
  {
    name: '超级管理员',
    code: 'super_admin',
    sort: 1,
    status: true,
    dataScope: 'ALL',
    remark: '拥有平台全部管理权限'
  },
  {
    name: '租户管理员',
    code: 'tenant_admin',
    sort: 10,
    status: true,
    dataScope: 'CUSTOM',
    remark: '负责本租户日常管理'
  },
  {
    name: '普通成员',
    code: 'tenant_member',
    sort: 20,
    status: true,
    dataScope: 'SELF',
    remark: '基础业务使用角色'
  }
];
