import { loadEnvFilesIntoProcess } from '../src/shared/config/env-files';

loadEnvFilesIntoProcess();

export const DEFAULT_TENANT_ID = 'tenant_001' as const;

export const LOCAL_ADMIN_SEED = {
  tenantId: DEFAULT_TENANT_ID,
  departmentId: 100,
  username: process.env.DEFAULT_ADMIN_USERNAME?.trim() || 'admin',
  password: process.env.DEFAULT_ADMIN_PASSWORD?.trim() || '123456',
  nickname: '\u7cfb\u7edf\u7ba1\u7406\u5458',
  phone: '13800000000',
  email: 'admin@luckycolor.local',
  avatar: 'https://static.luckycolor.local/avatar/admin.png'
} as const;

export const REQUIRED_BOOTSTRAP_ROLE_CODES = [
  'super_admin',
  'tenant_admin',
  'tenant_member'
] as const;

export type BootstrapRoleCode =
  (typeof REQUIRED_BOOTSTRAP_ROLE_CODES)[number];

export const REQUIRED_BOOTSTRAP_MENU_KEYS = [
  'main_system',
  'main_system_users',
  'main_system_menu',
  'icomponent_dict'
] as const;

export const REQUIRED_BOOTSTRAP_DICT_VALUES = [
  'COMMON_STATUS',
  'MENU_TYPE',
  'NOTICE_TYPE'
] as const;

export const TENANT_ADMIN_MENU_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14
] as const;

export const TENANT_MEMBER_MENU_IDS = [1, 2, 3, 11] as const;

export const TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS = [100, 120] as const;
