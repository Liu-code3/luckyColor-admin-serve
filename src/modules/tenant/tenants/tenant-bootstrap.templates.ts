export const DEFAULT_TENANT_ROLE_TEMPLATES = [
  {
    name: 'Tenant Admin',
    code: 'tenant_admin',
    sort: 10,
    status: true,
    dataScope: 'CUSTOM',
    remark: 'Default tenant administrator role'
  },
  {
    name: 'Tenant Member',
    code: 'tenant_member',
    sort: 20,
    status: true,
    dataScope: 'SELF',
    remark: 'Default tenant member role'
  }
] as const;

export const DEFAULT_TENANT_ROLE_MENU_CODES: Record<string, number[]> = {
  tenant_admin: [1, 2, 3, 4, 5, 6, 7, 8, 11],
  tenant_member: [1, 2, 3, 11]
};

export const DEFAULT_TENANT_DICTIONARY_SEEDS = [
  {
    suffix: 'notice_scope_root',
    parentSuffix: null,
    weight: 1,
    name: 'Tenant Notice Scope',
    dictLabel: 'Tenant Notice Scope',
    dictValue: 'TENANT_NOTICE_SCOPE',
    category: 'TENANT',
    sortCode: 1
  },
  {
    suffix: 'notice_scope_all',
    parentSuffix: 'notice_scope_root',
    weight: 10,
    name: 'All Members',
    dictLabel: 'All Members',
    dictValue: 'ALL',
    category: 'TENANT',
    sortCode: 10
  },
  {
    suffix: 'notice_scope_department',
    parentSuffix: 'notice_scope_root',
    weight: 20,
    name: 'Department Only',
    dictLabel: 'Department Only',
    dictValue: 'DEPARTMENT',
    category: 'TENANT',
    sortCode: 20
  },
  {
    suffix: 'notice_scope_role',
    parentSuffix: 'notice_scope_root',
    weight: 30,
    name: 'Role Only',
    dictLabel: 'Role Only',
    dictValue: 'ROLE',
    category: 'TENANT',
    sortCode: 30
  }
] as const;

export const DEFAULT_TENANT_DEPARTMENT_TEMPLATES = [
  {
    key: 'headquarters',
    parentKey: null,
    name: 'Headquarters',
    codeSuffix: 'headquarters',
    sort: 1,
    remark: 'Default root department'
  },
  {
    key: 'product',
    parentKey: 'headquarters',
    name: 'Product',
    codeSuffix: 'product',
    sort: 10,
    remark: 'Default product department'
  },
  {
    key: 'operations',
    parentKey: 'headquarters',
    name: 'Operations',
    codeSuffix: 'operations',
    sort: 20,
    remark: 'Default operations department'
  }
] as const;

export function buildDefaultTenantDepartments(
  tenantId: string,
  tenantCode: string
) {
  return DEFAULT_TENANT_DEPARTMENT_TEMPLATES.map((item) => ({
    key: item.key,
    parentKey: item.parentKey,
    tenantId,
    name: item.name,
    code: `${tenantCode}_${item.codeSuffix}`,
    leader: null,
    phone: null,
    email: null,
    sort: item.sort,
    status: true,
    remark: item.remark
  }));
}

export function buildDefaultTenantDictionaries(tenantId: string) {
  return DEFAULT_TENANT_DICTIONARY_SEEDS.map((item) => ({
    id: `${tenantId}_${item.suffix}`,
    parentId: item.parentSuffix ? `${tenantId}_${item.parentSuffix}` : null,
    weight: item.weight,
    name: item.name,
    tenantId,
    dictLabel: item.dictLabel,
    dictValue: item.dictValue,
    category: item.category,
    sortCode: item.sortCode,
    deleteFlag: 'NOT_DELETE',
    createTime: null,
    createUser: 'tenant_initializer',
    updateTime: null,
    updateUser: null
  }));
}
