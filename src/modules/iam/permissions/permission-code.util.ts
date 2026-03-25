export interface PermissionCodeCarrier {
  permissionCode?: string | null;
  menuKey?: string | null;
}

export function resolvePermissionCode(input: PermissionCodeCarrier) {
  const permissionCode = input.permissionCode?.trim();
  if (permissionCode) {
    return permissionCode;
  }

  const menuKey = input.menuKey?.trim();
  return menuKey ?? '';
}

export function normalizePermissionCode(
  permissionCode: string | null | undefined,
  fallbackMenuKey: string
) {
  const normalizedPermissionCode = permissionCode?.trim();
  if (normalizedPermissionCode) {
    return normalizedPermissionCode;
  }

  return fallbackMenuKey;
}
