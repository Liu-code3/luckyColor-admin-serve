import { Prisma, PrismaClient } from '../src/generated/prisma';
import { buildSetDatabaseTimeZoneSql } from '../src/shared/time/database-timezone';
import { menuSeedData } from './seed-data/menu.data';

const prisma = new PrismaClient();

const TENANT_CENTER_MENU_IDS = [15, 16, 17];
const SYSTEM_MANAGEMENT_MENU_IDS = [13, 14];

async function main() {
  await prisma.$executeRawUnsafe(buildSetDatabaseTimeZoneSql());

  const menus = menuSeedData.filter(
    (item) =>
      SYSTEM_MANAGEMENT_MENU_IDS.includes(item.id) ||
      TENANT_CENTER_MENU_IDS.includes(item.id)
  );

  for (const item of menus) {
    await prisma.menu.upsert({
      where: {
        id: item.id
      },
      create: {
        id: item.id,
        parentId: item.parentId,
        title: item.title,
        name: item.name,
        type: item.type,
        path: item.path,
        menuKey: item.menuKey,
        icon: item.icon,
        layout: item.layout,
        isVisible: item.isVisible,
        component: item.component,
        redirect: null,
        meta: (item.meta ?? undefined) as Prisma.InputJsonValue | undefined,
        sort: item.sort
      },
      update: {
        parentId: item.parentId,
        title: item.title,
        name: item.name,
        type: item.type,
        path: item.path,
        menuKey: item.menuKey,
        icon: item.icon,
        layout: item.layout,
        isVisible: item.isVisible,
        component: item.component,
        meta: (item.meta ?? undefined) as Prisma.InputJsonValue | undefined,
        sort: item.sort
      }
    });
  }

  const roles = await prisma.role.findMany({
    where: {
      code: {
        in: ['super_admin', 'tenant_admin']
      }
    },
    select: {
      id: true,
      tenantId: true,
      code: true
    }
  });

  const existingTenantRoleBindings = await prisma.roleMenu.findMany({
    where: {
      menuId: {
        in: [15, 16]
      }
    },
    select: {
      tenantId: true,
      roleId: true
    }
  });

  const roleMenuRows = roles.flatMap((role) => {
    const menuIds =
      role.code === 'super_admin'
        ? TENANT_CENTER_MENU_IDS
        : SYSTEM_MANAGEMENT_MENU_IDS;

    return menuIds.map((menuId) => ({
      tenantId: role.tenantId,
      roleId: role.id,
      menuId
    }));
  });

  const tenantCenterParentRows = Array.from(
    new Map(
      existingTenantRoleBindings.map((item) => [
        `${item.tenantId}:${item.roleId}:17`,
        {
          tenantId: item.tenantId,
          roleId: item.roleId,
          menuId: 17
        }
      ])
    ).values()
  );

  const allRoleMenuRows = [...roleMenuRows, ...tenantCenterParentRows];

  if (allRoleMenuRows.length > 0) {
    await prisma.roleMenu.createMany({
      data: allRoleMenuRows,
      skipDuplicates: true
    });
  }

  console.log(
    `Upserted ${menus.length} menus and synced ${allRoleMenuRows.length} role-menu bindings.`
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
