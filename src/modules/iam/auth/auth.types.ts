import { Prisma } from '../../../generated/prisma';

export const AUTH_USER_ACCESS_INCLUDE = {
  roles: {
    include: {
      role: {
        include: {
          menus: {
            include: {
              menu: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof AUTH_USER_ACCESS_INCLUDE;
}>;

export type AuthRoleRecord = Prisma.RoleGetPayload<{
  include: {
    menus: {
      include: {
        menu: true;
      };
    };
  };
}>;

export type AuthMenuRecord = Prisma.MenuGetPayload<Record<string, never>>;
