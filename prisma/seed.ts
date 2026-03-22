import { Prisma, PrismaClient } from '../src/generated/prisma';
import { hashPassword } from '../src/infra/security/password.util';
import { buildSetDatabaseTimeZoneSql } from '../src/shared/time/database-timezone';
import { departmentSeedData } from './seed-data/department.data';
import { dictTreeData } from './seed-data/dict-tree.data';
import { menuSeedData } from './seed-data/menu.data';
import { noticeSeedData } from './seed-data/notice.data';
import { roleSeedData } from './seed-data/role.data';
import { systemConfigSeedData } from './seed-data/system-config.data';
import { tenantPackageSeedData } from './seed-data/tenant-package.data';
import { tenantAuditLogSeedData } from './seed-data/tenant-audit-log.data';
import { tenantSeedData } from './seed-data/tenant.data';

interface DictionarySeedNode {
  id: string;
  parentId: string;
  weight: number;
  name: string;
  tenantId?: string;
  dictLabel: string;
  dictValue: string;
  category: string;
  sortCode: number;
  deleteFlag: string;
  createTime?: string;
  createUser?: string;
  updateTime?: string;
  updateUser?: string;
  children?: DictionarySeedNode[];
}

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(buildSetDatabaseTimeZoneSql());

  const dictionaryRows = flattenDictionaryNodes(
    dictTreeData.data as DictionarySeedNode[]
  );

  await prisma.roleDepartmentScope.deleteMany();
  await prisma.roleMenu.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.tenantAuditLog.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.dictionary.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.tenantPackage.deleteMany();

  await prisma.tenantPackage.createMany({
    data: tenantPackageSeedData.map((item) => ({
      ...item,
      featureFlags: item.featureFlags as Prisma.InputJsonValue
    }))
  });

  await prisma.tenant.createMany({
    data: tenantSeedData
  });

  await prisma.tenantAuditLog.createMany({
    data: tenantAuditLogSeedData.map((item) => ({
      ...item,
      detail: item.detail as Prisma.InputJsonValue
    }))
  });

  const adminUser = await prisma.user.create({
    data: {
      tenantId: 'tenant_001',
      username: 'admin',
      password: await hashPassword('123456'),
      nickname: '系统管理员'
    }
  });

  await prisma.role.createMany({
    data: roleSeedData
  });

  const roles = await prisma.role.findMany({
    orderBy: { sort: 'asc' }
  });

  await prisma.department.createMany({
    data: departmentSeedData
  });

  await prisma.systemConfig.createMany({
    data: systemConfigSeedData
  });

  await prisma.notice.createMany({
    data: noticeSeedData
  });

  await prisma.menu.createMany({
    data: menuSeedData.map((item) => ({
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
    }))
  });

  await prisma.dictionary.createMany({
    data: dictionaryRows
  });

  const superAdminRole = roles.find((item) => item.code === 'super_admin');
  const tenantAdminRole = roles.find((item) => item.code === 'tenant_admin');
  const tenantMemberRole = roles.find((item) => item.code === 'tenant_member');

  if (superAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        tenantId: 'tenant_001',
        roleId: superAdminRole.id
      }
    });
  }

  const allMenuIds = menuSeedData.map((item) => item.id);
  const tenantAdminMenuIds = [1, 2, 3, 4, 5, 6, 7, 8, 11];
  const tenantMemberMenuIds = [1, 2, 3, 11];
  const tenantAdminDataScopeDepartmentIds = [100, 120];

  const roleMenuAssignments = [
    {
      role: superAdminRole,
      menuIds: allMenuIds
    },
    {
      role: tenantAdminRole,
      menuIds: tenantAdminMenuIds
    },
    {
      role: tenantMemberRole,
      menuIds: tenantMemberMenuIds
    }
  ]
    .filter((item) => item.role)
    .flatMap((item) =>
      item.menuIds.map((menuId) => ({
        roleId: item.role!.id,
        tenantId: 'tenant_001',
        menuId
      }))
    );

  if (roleMenuAssignments.length) {
    await prisma.roleMenu.createMany({
      data: roleMenuAssignments
    });
  }

  if (tenantAdminRole) {
    await prisma.roleDepartmentScope.createMany({
      data: tenantAdminDataScopeDepartmentIds.map((departmentId) => ({
        roleId: tenantAdminRole.id,
        tenantId: 'tenant_001',
        departmentId
      }))
    });
  }
}

function flattenDictionaryNodes(nodes: DictionarySeedNode[]) {
  const result: Array<{
    id: string;
    parentId: string | null;
    weight: number;
    name: string;
    tenantId: string | null;
    dictLabel: string;
    dictValue: string;
    category: string;
    sortCode: number;
    deleteFlag: string;
    createTime: string | null;
    createUser: string | null;
    updateTime: string | null;
    updateUser: string | null;
  }> = [];

  const walk = (items: DictionarySeedNode[]) => {
    items.forEach((item) => {
      result.push({
        id: item.id,
        parentId: item.parentId === '0' ? null : item.parentId,
        weight: item.weight,
        name: item.name,
        tenantId: item.tenantId ?? null,
        dictLabel: item.dictLabel,
        dictValue: item.dictValue,
        category: item.category,
        sortCode: item.sortCode,
        deleteFlag: item.deleteFlag,
        createTime: item.createTime ?? null,
        createUser: item.createUser ?? null,
        updateTime: item.updateTime ?? null,
        updateUser: item.updateUser ?? null
      });

      if (item.children?.length) {
        walk(item.children);
      }
    });
  };

  walk(nodes);
  return result;
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
