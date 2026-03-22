export const ROLE_DATA_SCOPE_VALUES = [
  'ALL',
  'DEPARTMENT',
  'DEPARTMENT_AND_CHILDREN',
  'SELF',
  'CUSTOM'
] as const;

export type RoleDataScope = (typeof ROLE_DATA_SCOPE_VALUES)[number];
