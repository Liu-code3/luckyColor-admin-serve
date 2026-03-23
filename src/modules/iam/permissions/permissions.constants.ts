export const PERMISSION_METADATA = 'permission_metadata';

export type PermissionMatchMode = 'ANY' | 'ALL';

export interface PermissionRequirement {
  permissions: string[];
  mode: PermissionMatchMode;
}
