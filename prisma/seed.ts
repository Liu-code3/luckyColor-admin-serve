import { Prisma, PrismaClient } from '../src/generated/prisma';
import { hashPassword } from '../src/infra/security/password.util';
import { DEFAULT_ROLE_DIRECT_PERMISSION_CODES } from '../src/modules/iam/permissions/permission-point-codes';
import { buildSetDatabaseTimeZoneSql } from '../src/shared/time/database-timezone';
import { departmentSeedData } from './seed-data/department.data';
import { dictTreeData } from './seed-data/dict-tree.data';
import { i18nResourceSeedData } from './seed-data/i18n-resource.data';
import { menuSeedData } from './seed-data/menu.data';
import { noticeSeedData } from './seed-data/notice.data';
import { roleSeedData } from './seed-data/role.data';
import { systemConfigSeedData } from './seed-data/system-config.data';
import { tenantPackageSeedData } from './seed-data/tenant-package.data';
import { tenantAuditLogSeedData } from './seed-data/tenant-audit-log.data';
import { tenantSeedData } from './seed-data/tenant.data';
import {
  DEFAULT_TENANT_ID,
  LOCAL_ADMIN_SEED,
  REQUIRED_BOOTSTRAP_DICT_VALUES,
  REQUIRED_BOOTSTRAP_ROLE_CODES,
  TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS,
  TENANT_ADMIN_MENU_IDS,
  TENANT_MEMBER_MENU_IDS,
  type BootstrapRoleCode
} from './seed-manifest';
import {
  type DictionarySeedNode,
  flattenDictionaryNodes
} from './seed.helpers';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(buildSetDatabaseTimeZoneSql());

  const dictionaryRows = flattenDictionaryNodes(
    dictTreeData.data as DictionarySeedNode[]
  );

  assertBootstrapContract(dictionaryRows);

  await prisma.roleDepartmentScope.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.roleMenu.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.securityAuditLog.deleteMany();
  await prisma.tenantAuditLog.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.i18nResource.deleteMany();
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

  await prisma.role.createMany({
    data: roleSeedData
  });

  const roles = await prisma.role.findMany({
    orderBy: { sort: 'asc' }
  });
  const roleIdByCode = buildRoleIdByCode(roles);

  await prisma.department.createMany({
    data: departmentSeedData
  });

  const adminUser = await prisma.user.create({
    data: {
      tenantId: LOCAL_ADMIN_SEED.tenantId,
      departmentId: LOCAL_ADMIN_SEED.departmentId,
      username: LOCAL_ADMIN_SEED.username,
      password: await hashPassword(LOCAL_ADMIN_SEED.password),
      nickname: LOCAL_ADMIN_SEED.nickname,
      phone: LOCAL_ADMIN_SEED.phone,
      email: LOCAL_ADMIN_SEED.email,
      avatar: LOCAL_ADMIN_SEED.avatar,
      status: true,
      lastLoginAt: null
    }
  });

  await prisma.systemConfig.createMany({
    data: systemConfigSeedData
  });

  await prisma.notice.createMany({
    data: noticeSeedData
  });

  await prisma.i18nResource.createMany({
    data: i18nResourceSeedData
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
      permissionCode: item.permissionCode ?? item.menuKey,
      icon: item.icon,
      layout: item.layout,
      isVisible: item.isVisible,
      status: item.status ?? true,
      component: item.component,
      redirect: null,
      meta: (item.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      sort: item.sort
    }))
  });

  await prisma.dictionary.createMany({
    data: dictionaryRows
  });

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      tenantId: LOCAL_ADMIN_SEED.tenantId,
      roleId: roleIdByCode.super_admin
    }
  });

  const roleMenuAssignments = buildRoleMenuAssignments(
    roleIdByCode,
    menuSeedData.map((item) => item.id)
  );
  const rolePermissionAssignments = buildRolePermissionAssignments(
    roleMenuAssignments,
    menuSeedData,
    roleIdByCode
  );

  if (roleMenuAssignments.length > 0) {
    await prisma.roleMenu.createMany({
      data: roleMenuAssignments
    });
  }

  if (rolePermissionAssignments.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermissionAssignments,
      skipDuplicates: true
    });
  }

  await prisma.roleDepartmentScope.createMany({
    data: TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS.map((departmentId) => ({
      roleId: roleIdByCode.tenant_admin,
      tenantId: DEFAULT_TENANT_ID,
      departmentId
    }))
  });
}

function assertBootstrapContract(
  dictionaryRows: Array<{
    dictValue: string;
  }>
) {
  assertSubset(
    [DEFAULT_TENANT_ID, LOCAL_ADMIN_SEED.tenantId],
    tenantSeedData.map((item) => item.id),
    'bootstrap tenant ids'
  );
  assertSubset(
    [LOCAL_ADMIN_SEED.departmentId, ...TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS],
    departmentSeedData.map((item) => item.id),
    'bootstrap department ids'
  );
  assertSubset(
    [...TENANT_ADMIN_MENU_IDS, ...TENANT_MEMBER_MENU_IDS],
    menuSeedData.map((item) => item.id),
    'bootstrap menu ids'
  );
  assertSubset(
    [...REQUIRED_BOOTSTRAP_ROLE_CODES],
    roleSeedData.map((item) => item.code),
    'bootstrap role codes'
  );
  assertSubset(
    [...REQUIRED_BOOTSTRAP_DICT_VALUES],
    dictionaryRows.map((item) => item.dictValue),
    'bootstrap dictionary values'
  );
}

function buildRoleIdByCode(
  roles: Array<{
    id: string;
    code: string;
  }>
): Record<BootstrapRoleCode, string> {
  const roleMap = new Map(roles.map((item) => [item.code, item.id]));

  return REQUIRED_BOOTSTRAP_ROLE_CODES.reduce(
    (result, code) => {
      result[code] = getRequiredMapValue(roleMap, code, 'bootstrap role');
      return result;
    },
    {} as Record<BootstrapRoleCode, string>
  );
}

function buildRoleMenuAssignments(
  roleIdByCode: Record<BootstrapRoleCode, string>,
  allMenuIds: number[]
) {
  assertSubset(TENANT_ADMIN_MENU_IDS, allMenuIds, 'tenant admin menu ids');
  assertSubset(TENANT_MEMBER_MENU_IDS, allMenuIds, 'tenant member menu ids');

  return [
    {
      roleId: roleIdByCode.super_admin,
      menuIds: allMenuIds
    },
    {
      roleId: roleIdByCode.tenant_admin,
      menuIds: [...TENANT_ADMIN_MENU_IDS]
    },
    {
      roleId: roleIdByCode.tenant_member,
      menuIds: [...TENANT_MEMBER_MENU_IDS]
    }
  ].flatMap((item) =>
    item.menuIds.map((menuId) => ({
      roleId: item.roleId,
      tenantId: DEFAULT_TENANT_ID,
      menuId
    }))
  );
}

function buildRolePermissionAssignments(
  roleMenuAssignments: Array<{
    roleId: string;
    tenantId: string;
    menuId: number;
  }>,
  menus: Array<{
    id: number;
    menuKey: string;
    permissionCode?: string;
  }>,
  roleIdByCode: Record<BootstrapRoleCode, string>
) {
  const permissionCodeByMenuId = new Map(
    menus.map((menu) => [menu.id, menu.permissionCode ?? menu.menuKey])
  );
  const seenAssignments = new Set<string>();
  const menuPermissionRows = roleMenuAssignments.flatMap((assignment) => {
    const permissionCode = permissionCodeByMenuId.get(assignment.menuId);

    if (!permissionCode) {
      return [];
    }

    const assignmentKey = `${assignment.roleId}:${permissionCode}`;
    if (seenAssignments.has(assignmentKey)) {
      return [];
    }

    seenAssignments.add(assignmentKey);

    return {
      roleId: assignment.roleId,
      tenantId: assignment.tenantId,
      permissionCode
    };
  });
  const directPermissionRows = (
    Object.entries(DEFAULT_ROLE_DIRECT_PERMISSION_CODES) as Array<
      [BootstrapRoleCode, readonly string[]]
    >
  ).flatMap(([roleCode, permissionCodes]) =>
    permissionCodes.flatMap((permissionCode) => {
      const roleId = roleIdByCode[roleCode];
      const assignmentKey = `${roleId}:${permissionCode}`;

      if (seenAssignments.has(assignmentKey)) {
        return [];
      }

      seenAssignments.add(assignmentKey);

      return {
        roleId,
        tenantId: DEFAULT_TENANT_ID,
        permissionCode
      };
    })
  );

  return [...menuPermissionRows, ...directPermissionRows];
}

function assertSubset<T extends string | number>(
  requiredValues: readonly T[],
  availableValues: readonly T[],
  label: string
) {
  const availableValueSet = new Set(availableValues);
  const missingValues = requiredValues.filter(
    (value) => !availableValueSet.has(value)
  );

  if (missingValues.length > 0) {
    throw new Error(
      `Missing required ${label}: ${missingValues.join(', ')}`
    );
  }
}

function getRequiredMapValue<T>(
  map: Map<string, T>,
  key: string,
  label: string
) {
  const value = map.get(key);

  if (value === undefined) {
    throw new Error(`Missing required ${label}: ${key}`);
  }

  return value;
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
