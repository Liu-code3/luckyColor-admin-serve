import { resolvePermissionCode } from './permission-code.util';

type PermissionCodeValue = string | null | undefined;

export interface PermissionPointMenuBinding {
  menu: {
    permissionCode?: PermissionCodeValue;
    menuKey: PermissionCodeValue;
    status: boolean;
  };
}

export interface PermissionPointRoleLike {
  menus?: PermissionPointMenuBinding[];
  permissions?: Array<{
    permissionCode: PermissionCodeValue;
  }>;
}

export function collectGrantedPermissionCodes(
  roles: PermissionPointRoleLike[]
) {
  const grantedCodes = new Set<string>();
  const disabledMenuCodes = new Set<string>();

  roles.forEach((role) => {
    role.permissions?.forEach((permission) => {
      const code = resolvePermissionCode(permission);
      if (code) {
        grantedCodes.add(code);
      }
    });

    role.menus?.forEach((binding) => {
      const code = resolvePermissionCode(binding.menu);
      if (!code) {
        return;
      }

      if (binding.menu.status) {
        grantedCodes.add(code);
        return;
      }

      disabledMenuCodes.add(code);
    });
  });

  disabledMenuCodes.forEach((code) => grantedCodes.delete(code));

  return grantedCodes;
}
