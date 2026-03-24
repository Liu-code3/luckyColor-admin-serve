import { Prisma } from '../../../generated/prisma';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { MenusService } from './menus.service';

describe('MenusService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createMenu = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 301,
    parentId: null,
    title: 'Dashboard',
    name: 'DashboardView',
    type: 1,
    path: '/dashboard',
    menuKey: 'dashboard:view',
    icon: '',
    layout: '',
    isVisible: true,
    status: true,
    component: 'dashboard/index',
    redirect: null,
    meta: null,
    sort: 301,
    createdAt: new Date('2026-03-23T02:10:00.000Z'),
    updatedAt: new Date('2026-03-23T02:10:00.000Z'),
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      menu: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn()
      },
      role: {
        findFirst: jest.fn()
      },
      roleMenu: {
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return (input as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });

    return prisma;
  }

  function createTenantActorMock() {
    return {
      assertPlatformAdmin: jest.fn().mockResolvedValue(undefined)
    };
  }

  function createCurrentUser() {
    return {
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    };
  }

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('uses created id as default sort when sort is omitted', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findFirst.mockResolvedValue(null);
    prisma.menu.findMany.mockResolvedValue([]);

    prisma.menu.create.mockResolvedValue(
      createMenu({
        sort: 0
      })
    );
    prisma.menu.update.mockResolvedValue(createMenu());

    const response = await service.create({
      title: 'Dashboard',
      name: 'DashboardView',
      type: 1,
      path: '/dashboard',
      menuKey: 'dashboard:view',
      isVisible: true,
      component: 'dashboard/index'
    });

    expect(prisma.menu.create).toHaveBeenCalledWith({
      data: {
        id: undefined,
        parentId: null,
        title: 'Dashboard',
        name: 'DashboardView',
        type: 1,
        path: '/dashboard',
        menuKey: 'dashboard:view',
        icon: '',
        layout: '',
        isVisible: true,
        status: true,
        component: 'dashboard/index',
        redirect: null,
        meta: undefined,
        sort: 0
      }
    });
    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 301 },
      data: {
        sort: 301
      }
    });
    expect(response.data.id).toBe(301);
    expect(response.data.sort).toBe(301);
  });

  it('translates duplicate menu id conflicts into business errors', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findFirst.mockResolvedValue(null);
    prisma.menu.findMany.mockResolvedValue([]);

    prisma.menu.create.mockRejectedValue(createUniqueConstraintError(['id']));

    await expect(
      service.create({
        id: 301,
        title: 'Dashboard',
        name: 'DashboardView',
        type: 1,
        path: '/dashboard',
        menuKey: 'dashboard:view',
        isVisible: true,
        component: 'dashboard/index'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });

  it('rejects duplicate menu keys when creating menus', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findFirst.mockResolvedValue(
      createMenu({
        id: 999,
        menuKey: 'dashboard:view'
      })
    );

    await expect(
      service.create({
        title: 'Dashboard',
        name: 'DashboardView',
        type: 1,
        path: '/dashboard',
        menuKey: 'dashboard:view',
        isVisible: true,
        component: 'dashboard/index'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );

    expect(prisma.menu.create).not.toHaveBeenCalled();
  });

  it('applies status filter when querying menu list', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.count.mockResolvedValue(1);
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 8,
        title: '角色管理',
        status: false
      })
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      title: '角色',
      status: false
    });

    expect(prisma.menu.count).toHaveBeenCalledWith({
      where: {
        title: { contains: '角色' },
        status: false
      }
    });
    expect(prisma.menu.findMany).toHaveBeenCalledWith({
      where: {
        title: { contains: '角色' },
        status: false
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 10
    });
    expect(response.data.records[0].status).toBe(false);
  });

  it('rejects root button menus', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        title: '新增用户',
        name: 'UserCreate',
        type: 3,
        path: '',
        menuKey: 'system:user:create',
        isVisible: true,
        component: ''
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID)
    );

    expect(prisma.menu.create).not.toHaveBeenCalled();
  });

  it('rejects menus under button parents', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findFirst.mockResolvedValue(null);
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 13,
        parentId: 5,
        type: 3,
        title: '新增用户',
        name: 'UserCreate',
        path: '',
        menuKey: 'system:user:create',
        component: ''
      })
    ]);

    await expect(
      service.create({
        parentId: 13,
        title: '子菜单',
        name: 'ChildMenu',
        type: 2,
        path: '/child',
        menuKey: 'child:view',
        isVisible: true,
        component: 'child/index'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID)
    );
  });

  it('returns tenant scoped menu tree with ancestor nodes', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT',
        sort: 1
      }),
      createMenu({
        id: 11,
        parentId: 1,
        title: '通知公告',
        name: 'NoticeManage',
        type: 2,
        path: '/system/notices',
        menuKey: 'system:notice:list',
        sort: 11
      }),
      createMenu({
        id: 12,
        parentId: 11,
        title: '新增公告',
        name: 'NoticeCreate',
        type: 3,
        path: '',
        menuKey: 'system:notice:create',
        component: '',
        sort: 12
      })
    ]);
    prisma.roleMenu.findMany.mockResolvedValue([{ menuId: 12 }]);

    const response = await service.tree(createCurrentUser(), {
      view: 'tenant'
    });

    expect(prisma.roleMenu.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant_001'
      }
    });
    expect(response.data).toEqual([
      expect.objectContaining({
        id: 1,
        children: [
          expect.objectContaining({
            id: 11,
            children: [
              expect.objectContaining({
                id: 12
              })
            ]
          })
        ]
      })
    ]);
  });

  it('blocks tenant admins from requesting platform menu tree view', async () => {
    const prisma = createPrismaMock();
    const tenantActor = {
      assertPlatformAdmin: jest
        .fn()
        .mockRejectedValue(
          new BusinessException(BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED)
        )
    };
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      tenantActor as never
    );

    await expect(
      service.tree(createCurrentUser(), {
        view: 'platform'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED)
    );

    expect(prisma.menu.findMany).not.toHaveBeenCalled();
  });

  it('returns role scoped menu tree for current tenant', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT',
        sort: 1
      }),
      createMenu({
        id: 5,
        parentId: 1,
        title: '用户管理',
        name: 'UserManage',
        type: 2,
        path: '/system/users',
        menuKey: 'system:user:list',
        sort: 5
      })
    ]);
    prisma.role.findFirst.mockResolvedValue({
      id: 'role-1',
      menus: [{ menuId: 5, menu: createMenu({ id: 5, parentId: 1 }) }]
    });

    const response = await service.tree(createCurrentUser(), {
      roleId: 'role-1'
    });

    expect(prisma.role.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: 'role-1' }, { tenantId: 'tenant_001' }]
      },
      include: {
        menus: {
          include: {
            menu: true
          }
        }
      }
    });
    expect(response.data[0]).toEqual(
      expect.objectContaining({
        id: 1,
        children: [expect.objectContaining({ id: 5 })]
      })
    );
  });

  it('throws when role scoped tree target does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany.mockResolvedValue([]);
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(
      service.tree(createCurrentUser(), {
        roleId: 'missing-role'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND)
    );
  });

  it('syncs menu parent and sort in batch', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany
      .mockResolvedValueOnce([
        createMenu({
          id: 1,
          parentId: null,
          title: '系统管理',
          name: 'SystemManage',
          path: '/system',
          menuKey: 'system:root',
          component: 'LAYOUT',
          sort: 1
        }),
        createMenu({
          id: 5,
          parentId: null,
          title: '用户管理',
          name: 'UserManage',
          type: 2,
          path: '/system/users',
          menuKey: 'system:user:list',
          sort: 20
        })
      ])
      .mockResolvedValueOnce([
        createMenu({
          id: 1,
          parentId: null,
          title: '系统管理',
          name: 'SystemManage',
          path: '/system',
          menuKey: 'system:root',
          component: 'LAYOUT',
          sort: 1
        }),
        createMenu({
          id: 5,
          parentId: 1,
          title: '用户管理',
          name: 'UserManage',
          type: 2,
          path: '/system/users',
          menuKey: 'system:user:list',
          sort: 10
        })
      ]);
    prisma.menu.update.mockImplementation(async ({ where, data }) =>
      createMenu({
        id: where.id,
        parentId: data.parentId,
        sort: data.sort
      })
    );

    const response = await service.sync({
      menus: [
        {
          id: 5,
          parentId: 1,
          sort: 10
        }
      ]
    });

    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        parentId: 1,
        sort: 10
      }
    });
    expect(response.data).toEqual([
      expect.objectContaining({
        id: 1,
        children: [expect.objectContaining({ id: 5, pid: 1, sort: 10 })]
      })
    ]);
  });

  it('rejects sync when payload contains missing menus', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null
      })
    ]);

    await expect(
      service.sync({
        menus: [
          {
            id: 999,
            parentId: null,
            sort: 1
          }
        ]
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND)
    );

    expect(prisma.menu.update).not.toHaveBeenCalled();
  });

  it('rejects sync when payload contains duplicate menu ids', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );

    await expect(
      service.sync({
        menus: [
          {
            id: 5,
            parentId: null,
            sort: 1
          },
          {
            id: 5,
            parentId: 1,
            sort: 2
          }
        ]
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID)
    );
  });

  it('rejects sync when it creates descendant cycles', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null,
        type: 1,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT'
      }),
      createMenu({
        id: 5,
        parentId: 1,
        type: 2,
        title: '用户管理',
        name: 'UserManage',
        path: '/system/users',
        menuKey: 'system:user:list'
      })
    ]);

    await expect(
      service.sync({
        menus: [
          {
            id: 1,
            parentId: 5,
            sort: 1
          }
        ]
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID)
    );

    expect(prisma.menu.update).not.toHaveBeenCalled();
  });

  it('rejects moving a menu under its descendant', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findUnique.mockResolvedValue(
      createMenu({
        id: 1,
        parentId: null,
        type: 1,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT'
      })
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null,
        type: 1,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT'
      }),
      createMenu({
        id: 5,
        parentId: 1,
        type: 2,
        title: '用户管理',
        name: 'UserManage',
        path: '/system/users',
        menuKey: 'system:user:list'
      })
    ]);

    await expect(
      service.update(1, {
        parentId: 5
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID)
    );

    expect(prisma.menu.update).not.toHaveBeenCalled();
  });

  it('cascades child menus when disabling a parent menu', async () => {
    const prisma = createPrismaMock();
    const service = new MenusService(
      prisma as never,
      createTenantScope(),
      createTenantActorMock() as never
    );
    prisma.menu.findUnique.mockResolvedValue(
      createMenu({
        id: 1,
        parentId: null,
        type: 1,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT'
      })
    );
    prisma.menu.findMany.mockResolvedValue([
      createMenu({
        id: 1,
        parentId: null,
        type: 1,
        title: '系统管理',
        name: 'SystemManage',
        path: '/system',
        menuKey: 'system:root',
        component: 'LAYOUT'
      }),
      createMenu({
        id: 5,
        parentId: 1,
        type: 2,
        title: '用户管理',
        name: 'UserManage',
        path: '/system/users',
        menuKey: 'system:user:list'
      }),
      createMenu({
        id: 13,
        parentId: 5,
        type: 3,
        title: '新增用户',
        name: 'UserCreate',
        path: '',
        menuKey: 'system:user:create',
        component: ''
      })
    ]);
    prisma.menu.updateMany.mockResolvedValue({ count: 2 });
    prisma.menu.update.mockResolvedValue(
      createMenu({
        id: 1,
        status: false
      })
    );

    const response = await service.updateStatus(1, {
      status: false
    });

    expect(prisma.menu.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [5, 13]
        }
      },
      data: {
        status: false
      }
    });
    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: false
      }
    });
    expect(response.data.status).toBe(false);
  });
});
