import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const createRole = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'role-1',
    name: '超级管理员',
    code: 'super_admin',
    sort: 1,
    status: true,
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

  function createPrismaMock() {
    const prisma = {
      role: {
        findUnique: jest.fn()
      },
      menu: {
        findMany: jest.fn()
      },
      roleMenu: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)
    );

    return prisma;
  }

  it('returns assigned menus for a role', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never);
    prisma.role.findUnique.mockResolvedValue({
      ...createRole(),
      menus: [
        {
          menu: createMenu({ id: 11, parentId: 1, title: '通知公告', name: 'NoticeManage', type: 2, path: '/system/notices', menuKey: 'system:notice:list', sort: 11 })
        },
        {
          menu: createMenu()
        }
      ]
    });

    const response = await service.menus('role-1');

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      include: {
        menus: {
          include: {
            menu: true
          }
        }
      }
    });
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
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

  it('throws when assigning menus to a missing role', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never);
    prisma.role.findUnique.mockResolvedValue(null);

    await expect(
      service.assignMenus('missing-role', { menuIds: [1] })
    ).rejects.toThrow(new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND));

    expect(prisma.menu.findMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when any assigned menu does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never);
    prisma.role.findUnique.mockResolvedValue(createRole());
    prisma.menu.findMany.mockResolvedValue([createMenu()]);

    await expect(
      service.assignMenus('role-1', { menuIds: [1, 2] })
    ).rejects.toThrow(new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND));

    expect(prisma.roleMenu.deleteMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.createMany).not.toHaveBeenCalled();
  });

  it('replaces role menus and returns the latest assignment result', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never);
    const role = createRole();
    const menus = [
      createMenu(),
      createMenu({ id: 11, parentId: 1, title: '通知公告', name: 'NoticeManage', type: 2, path: '/system/notices', menuKey: 'system:notice:list', sort: 11 })
    ];

    prisma.role.findUnique.mockResolvedValue(role);
    prisma.menu.findMany.mockResolvedValue(menus);
    prisma.roleMenu.deleteMany.mockResolvedValue({ count: 3 });
    prisma.roleMenu.createMany.mockResolvedValue({ count: 2 });

    const response = await service.assignMenus('role-1', { menuIds: [1, 11] });

    expect(prisma.roleMenu.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' }
    });
    expect(prisma.roleMenu.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 'role-1', menuId: 1 },
        { roleId: 'role-1', menuId: 11 }
      ]
    });
    expect(response.data.menuIds).toEqual([1, 11]);
    expect(response.data.menus).toEqual([
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
    ]);
  });

  it('supports clearing all assigned menus', async () => {
    const prisma = createPrismaMock();
    const service = new RolesService(prisma as never);
    prisma.role.findUnique.mockResolvedValue(createRole());
    prisma.roleMenu.deleteMany.mockResolvedValue({ count: 2 });

    const response = await service.assignMenus('role-1', { menuIds: [] });

    expect(prisma.menu.findMany).not.toHaveBeenCalled();
    expect(prisma.roleMenu.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' }
    });
    expect(prisma.roleMenu.createMany).not.toHaveBeenCalled();
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        roleId: 'role-1',
        name: '超级管理员',
        code: 'super_admin',
        menuIds: [],
        menus: []
      }
    });
  });
});
