export const SYSTEM_PERMISSION_POINTS = {
  user: {
    create: 'system:user:create',
    update: 'system:user:update',
    status: 'system:user:status',
    resetPassword: 'system:user:reset-password',
    assignRole: 'system:user:assign-role',
    delete: 'system:user:delete'
  },
  role: {
    create: 'system:role:create',
    update: 'system:role:update',
    status: 'system:role:status',
    dataScope: 'system:role:data-scope',
    assignMenu: 'system:role:assign-menu',
    delete: 'system:role:delete'
  },
  menu: {
    create: 'system:menu:create',
    sync: 'system:menu:sync',
    update: 'system:menu:update',
    status: 'system:menu:status',
    delete: 'system:menu:delete'
  },
  department: {
    create: 'system:department:create',
    update: 'system:department:update',
    status: 'system:department:status',
    delete: 'system:department:delete'
  },
  dictionary: {
    create: 'system:dictionary:create',
    refreshCache: 'system:dictionary:refresh-cache',
    update: 'system:dictionary:update',
    delete: 'system:dictionary:delete'
  },
  dictionaryType: {
    create: 'system:dictionary-type:create',
    update: 'system:dictionary-type:update',
    delete: 'system:dictionary-type:delete'
  },
  dictionaryItem: {
    status: 'system:dictionary-item:status',
    sort: 'system:dictionary-item:sort'
  },
  config: {
    create: 'system:config:create',
    refreshCache: 'system:config:refresh-cache',
    update: 'system:config:update',
    delete: 'system:config:delete'
  },
  notice: {
    create: 'system:notice:create',
    update: 'system:notice:update',
    delete: 'system:notice:delete'
  }
} as const;

export const TENANT_PERMISSION_POINTS = {
  tenant: {
    create: 'tenant:tenant:create',
    update: 'tenant:tenant:update'
  },
  package: {
    create: 'tenant:package:create',
    update: 'tenant:package:update',
    delete: 'tenant:package:delete'
  }
} as const;

const SYSTEM_ACTION_PERMISSION_CODES = [
  ...Object.values(SYSTEM_PERMISSION_POINTS.user),
  ...Object.values(SYSTEM_PERMISSION_POINTS.role),
  ...Object.values(SYSTEM_PERMISSION_POINTS.menu),
  ...Object.values(SYSTEM_PERMISSION_POINTS.department),
  ...Object.values(SYSTEM_PERMISSION_POINTS.dictionary),
  ...Object.values(SYSTEM_PERMISSION_POINTS.dictionaryType),
  ...Object.values(SYSTEM_PERMISSION_POINTS.dictionaryItem),
  ...Object.values(SYSTEM_PERMISSION_POINTS.config),
  ...Object.values(SYSTEM_PERMISSION_POINTS.notice)
] as const;

const TENANT_ACTION_PERMISSION_CODES = [
  ...Object.values(TENANT_PERMISSION_POINTS.tenant),
  ...Object.values(TENANT_PERMISSION_POINTS.package)
] as const;

export const DEFAULT_ROLE_DIRECT_PERMISSION_CODES = {
  super_admin: [
    ...SYSTEM_ACTION_PERMISSION_CODES,
    ...TENANT_ACTION_PERMISSION_CODES
  ],
  tenant_admin: [...SYSTEM_ACTION_PERMISSION_CODES],
  tenant_member: []
} as const satisfies Record<string, readonly string[]>;
