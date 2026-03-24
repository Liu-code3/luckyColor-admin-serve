export const PERMISSION_METADATA = 'permission_metadata';

export type PermissionMatchMode = 'ANY' | 'ALL';
export type PermissionBoundary = 'ANY' | 'PLATFORM_ADMIN';

export interface PermissionRequirement {
  permissions: string[];
  mode: PermissionMatchMode;
  boundary?: PermissionBoundary;
  denialCode?: number;
}
