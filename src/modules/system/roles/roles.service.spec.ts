import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createRole = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'role-1',
    tenantId: 'tenant_001',
    name: '超级管理员',
    code: 'super_admin',
    sort: 1,
    status: true,
    dataScope: 'ALL',
    remark: null,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    ...overrides
  });

  const createMenu = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    parentId: 0,
    title: '系统管理',
    name: 'SystemManage',
    type: 1,
    path: '/system',
    menuKey: 'system:root',
    icon: 'SettingOutlined',
    layout: 'default',
    isVisible: true,
    component: 'LAYOUT',
    redirect: null,
    meta: null,
    sort: 1,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    ...overrides
  });

  const createDepartment = (
    overrides: Partial<Record<string, unknown>> = {}
  ) => ({
    id: 100,
    tenantId: 'tenant_001',
    parentId: null,
    name: '总部',
    code: 'headquarters',
    leader: null,
    phone: null,
    email: null,
    sort: 1,
    status: true,
    remark: null,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      role: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
      },
      menu: {
        findMany: jest.fn()
      },
      department: {
        findMany: jest.fn()
      },
      roleMenu: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      roleDepartmentScope: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
    );

    return prisma;
  }

  it('returns assigned menus for a role', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue({
      ...createRole(),
      menus: [
        {
          menu: createMenu({
            id: 11,
            parentId: 1,
            title: '通知公告',
            name: 'NoticeManage',
            type: 2,
            path: '/system/notices',
            menuKey: 'system:notice:list',
            sort: 11
          })
        },
        {
          menu: createMenu()
        }
      ]
    });

    const response = await service.menus('role-1');

    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
        tenantId: 'tenant_001',
        name: '超级管理员',
        code: 'super_admin',
        menuIds: [1, 11],
        menus: [
          {
            id: 1,
            pid: 0,
            title: '系统管理',
            name: 'SystemManage',
            type: 1,
            path: '/system',
            key: 'system:root',
            isVisible: true,
            sort: 1
          },
          {
            id: 11,
            pid: 1,
            title: '通知公告',
            name: 'NoticeManage',
            type: 2,
            path: '/system/notices',
            key: 'system:notice:list',
            isVisible: true,
            sort: 11
          }
        ]
      }
    });
  });

  it('returns data scope details for a role', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue({
      ...createRole({
        name: '租户管理员',
        code: 'tenant_admin',
        dataScope: 'CUSTOM'
      }),
      dataScopeDepartments: [
        {
          departmentId: 120,
          department: createDepartment({
            id: 120,
            parentId: 100,
            name: '运营支持部',
            code: 'operations_support',
            sort: 20
          })
        },
        {
          departmentId: 100,
          department: createDepartment()
        }
      ]
    });

    const response = await service.dataScope('role-1');

    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
        tenantId: 'tenant_001',
        name: '租户管理员',
        code: 'tenant_admin',
        dataScope: 'CUSTOM',
        departmentIds: [100, 120],
        departments: [
          {
            id: 100,
            tenantId: 'tenant_001',
            pid: 0,
            name: '总部',
            code: 'headquarters'
          },
          {
            id: 120,
            tenantId: 'tenant_001',
            pid: 100,
            name: '运营支持部',
            code: 'operations_support'
          }
        ]
      }
    });
  });

  it('throws when custom data scope has no departments', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue(createRole());
    prisma.role.update.mockResolvedValue(createRole({ dataScope: 'CUSTOM' }));

    await expect(
      service.assignDataScope('role-1', {
        dataScope: 'CUSTOM',
        departmentIds: []
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID)
    );

    expect(prisma.roleDepartmentScope.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when custom data scope contains missing departments', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue(createRole());
    prisma.role.update.mockResolvedValue(createRole({ dataScope: 'CUSTOM' }));
    prisma.department.findMany.mockResolvedValue([createDepartment()]);

    await expect(
      service.assignDataScope('role-1', {
        dataScope: 'CUSTOM',
        departmentIds: [100, 120]
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND)
    );

    expect(prisma.roleDepartmentScope.deleteMany).not.toHaveBeenCalled();
  });

  it('updates custom data scope departments', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    const role = createRole({
      name: '租户管理员',
      code: 'tenant_admin',
      dataScope: 'CUSTOM'
    });
    const departments = [
      createDepartment(),
      createDepartment({
        id: 120,
        parentId: 100,
        name: '运营支持部',
        code: 'operations_support',
        sort: 20
      })
    ];

    prisma.role.findFirst.mockResolvedValueOnce(role).mockResolvedValueOnce({
      ...role,
      dataScope: 'CUSTOM',
      dataScopeDepartments: departments.map((department) => ({
        departmentId: department.id as number,
        department
      }))
    });
    prisma.role.update.mockResolvedValue({
      ...role,
      dataScope: 'CUSTOM'
    });
    prisma.department.findMany.mockResolvedValue(departments);
    prisma.roleDepartmentScope.deleteMany.mockResolvedValue({ count: 1 });
    prisma.roleDepartmentScope.createMany.mockResolvedValue({ count: 2 });

    const response = await service.assignDataScope('role-1', {
      dataScope: 'CUSTOM',
      departmentIds: [100, 120]
    });

    expect(prisma.roleDepartmentScope.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1', tenantId: 'tenant_001' }
    });
    expect(prisma.roleDepartmentScope.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 'role-1', departmentId: 100, tenantId: 'tenant_001' },
        { roleId: 'role-1', departmentId: 120, tenantId: 'tenant_001' }
      ]
    });
    expect(response.data.departmentIds).toEqual([100, 120]);
  });

  it('clears department bindings when switching to non-custom data scope', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    const role = createRole({
      name: '租户管理员',
      code: 'tenant_admin',
      dataScope: 'DEPARTMENT_AND_CHILDREN'
    });

    prisma.role.findFirst.mockResolvedValueOnce(role).mockResolvedValueOnce({
      ...role,
      dataScope: 'DEPARTMENT_AND_CHILDREN',
      dataScopeDepartments: []
    });
    prisma.role.update.mockResolvedValue({
      ...role,
      dataScope: 'DEPARTMENT_AND_CHILDREN'
    });
    prisma.roleDepartmentScope.deleteMany.mockResolvedValue({ count: 2 });

    const response = await service.assignDataScope('role-1', {
      dataScope: 'DEPARTMENT_AND_CHILDREN',
      departmentIds: []
    });

    expect(prisma.department.findMany).not.toHaveBeenCalled();
    expect(prisma.roleDepartmentScope.createMany).not.toHaveBeenCalled();
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
        tenantId: 'tenant_001',
        name: '租户管理员',
        code: 'tenant_admin',
        dataScope: 'DEPARTMENT_AND_CHILDREN',
        departmentIds: [],
        departments: []
      }
    });
  });

  it('throws when assigning menus to a missing role', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(
      service.assignMenus('missing-role', { menuIds: [1] })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND)
    );

    expect(prisma.menu.findMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when any assigned menu does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue(createRole());
    prisma.menu.findMany.mockResolvedValue([createMenu()]);

    await expect(
      service.assignMenus('role-1', { menuIds: [1, 2] })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND)
    );

    expect(prisma.roleMenu.deleteMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.createMany).not.toHaveBeenCalled();
  });

  it('replaces role menus and returns the latest assignment result', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    const role = createRole();
    const menus = [
      createMenu(),
      createMenu({
        id: 11,
        parentId: 1,
        title: '通知公告',
        name: 'NoticeManage',
        type: 2,
        path: '/system/notices',
        menuKey: 'system:notice:list',
        sort: 11
      })
    ];

    prisma.role.findFirst.mockResolvedValue(role);
    prisma.menu.findMany.mockResolvedValue(menus);
    prisma.roleMenu.deleteMany.mockResolvedValue({ count: 3 });
    prisma.roleMenu.createMany.mockResolvedValue({ count: 2 });

    const response = await service.assignMenus('role-1', { menuIds: [1, 11] });

    expect(prisma.roleMenu.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1', tenantId: 'tenant_001' }
    });
    expect(prisma.roleMenu.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 'role-1', menuId: 1, tenantId: 'tenant_001' },
        { roleId: 'role-1', menuId: 11, tenantId: 'tenant_001' }
      ]
    });
    expect(response.data.menuIds).toEqual([1, 11]);
  });

  it('supports clearing all assigned menus', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never, createTenantScope());
    prisma.role.findFirst.mockResolvedValue(createRole());
    prisma.roleMenu.deleteMany.mockResolvedValue({ count: 2 });

    const response = await service.assignMenus('role-1', { menuIds: [] });

    expect(prisma.menu.findMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.createMany).not.toHaveBeenCalled();
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
        tenantId: 'tenant_001',
        name: '超级管理员',
        code: 'super_admin',
        menuIds: [],
        menus: []
      }
    });
  });
});
