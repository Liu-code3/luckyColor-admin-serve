import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createMenu = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 4,
    parentId: null,
    title: '系统管理',
    name: 'system',
    type: 1,
    path: '/systemManagement',
    menuKey: 'main_system',
    icon: 'folder',
    layout: '',
    isVisible: true,
    component: 'sys',
    redirect: null,
    meta: null,
    sort: 4,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    ...overrides
  });

  const createRole = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'role-1',
    tenantId: 'tenant_001',
    name: '超级管理员',
    code: 'super_admin',
    sort: 1,
    status: true,
    remark: null,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    menus: [],
    ...overrides
  });

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    tenantId: 'tenant_001',
    username: 'admin',
    password: '123456',
    nickname: '系统管理员',
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    roles: [],
    ...overrides
  });

  function createService() {
    const prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn()
      }
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token')
    };
    const configService = {
      get: jest.fn().mockReturnValue('2h')
    };
    const passwordService = {
      isHash: jest.fn().mockReturnValue(true),
      hash: jest.fn().mockResolvedValue('hashed-password'),
      verify: jest.fn().mockResolvedValue(true)
    };

    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
      createTenantScope(),
      passwordService as never
    );

    return {
      service,
      prisma,
      jwtService,
      configService,
      passwordService
    };
  }

  it('returns permission summary in login response', async () => {
    const { service, prisma, jwtService, passwordService } = createService();
    prisma.user.findFirst.mockResolvedValue(
      createUser({
        roles: [
          {
            role: createRole({
              menus: [
                { menu: createMenu() },
                {
                  menu: createMenu({
                    id: 5,
                    parentId: 4,
                    title: '用户管理',
                    name: 'systemUsers',
                    type: 2,
                    path: '/systemManagement/system/users',
                    menuKey: 'main_system_users',
                    sort: 5
                  })
                },
                {
                  menu: createMenu({
                    id: 13,
                    parentId: 5,
                    title: '新增用户',
                    name: 'systemUsersCreate',
                    type: 3,
                    path: '',
                    menuKey: 'system:user:create',
                    component: '',
                    sort: 13
                  })
                }
              ]
            })
          }
        ]
      })
    );

    const response = await service.login({
      username: 'admin',
      password: '123456'
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant_001',
        username: 'admin'
      },
      include: {
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
      }
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });
    expect(passwordService.verify).toHaveBeenCalledWith('123456', '123456');
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        accessToken: 'signed-token',
        tokenType: 'Bearer',
        expiresIn: '2h',
        user: {
          id: 'user-1',
          tenantId: 'tenant_001',
          username: 'admin',
          nickname: '系统管理员',
          roleCodes: ['super_admin'],
          menuCodeList: ['main_system', 'main_system_users'],
          buttonCodeList: ['system:user:create']
        }
      }
    });
  });

  it('returns current access snapshot with deduplicated roles and menu tree', async () => {
    const { service, prisma } = createService();
    const rootMenu = createMenu();
    const childMenu = createMenu({
      id: 5,
      parentId: 4,
      title: '用户管理',
      name: 'systemUsers',
      type: 2,
      path: '/systemManagement/system/users',
      menuKey: 'main_system_users',
      sort: 5
    });
    const buttonMenu = createMenu({
      id: 13,
      parentId: 5,
      title: '新增用户',
      name: 'systemUsersCreate',
      type: 3,
      path: '',
      menuKey: 'system:user:create',
      component: '',
      sort: 13
    });
    const role = createRole({
      menus: [{ menu: rootMenu }, { menu: childMenu }, { menu: buttonMenu }]
    });

    prisma.user.findFirst.mockResolvedValue(
      createUser({
        roles: [{ role }, { role }]
      })
    );

    const response = await service.getAccess({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });

    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        user: {
          id: 'user-1',
          tenantId: 'tenant_001',
          username: 'admin',
          nickname: '系统管理员',
          roleCodes: ['super_admin'],
          menuCodeList: ['main_system', 'main_system_users'],
          buttonCodeList: ['system:user:create']
        },
        roles: [
          {
            id: 'role-1',
            tenantId: 'tenant_001',
            name: '超级管理员',
            code: 'super_admin'
          }
        ],
        menuTree: [
          {
            pid: 0,
            id: 4,
            title: '系统管理',
            name: 'system',
            type: 1,
            path: '/systemManagement',
            key: 'main_system',
            icon: 'folder',
            layout: '',
            isVisible: true,
            component: 'sys',
            redirect: undefined,
            meta: undefined,
            sort: 4,
            createdAt: new Date('2026-03-22T14:30:00.000Z'),
            updatedAt: new Date('2026-03-22T14:30:00.000Z'),
            children: [
              {
                pid: 4,
                id: 5,
                title: '用户管理',
                name: 'systemUsers',
                type: 2,
                path: '/systemManagement/system/users',
                key: 'main_system_users',
                icon: 'folder',
                layout: '',
                isVisible: true,
                component: 'sys',
                redirect: undefined,
                meta: undefined,
                sort: 5,
                createdAt: new Date('2026-03-22T14:30:00.000Z'),
                updatedAt: new Date('2026-03-22T14:30:00.000Z')
              }
            ]
          }
        ]
      }
    });
  });

  it('throws token invalid when current user does not exist', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.getProfile({
        sub: 'missing-user',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID)
    );
  });

  it('filters disabled roles from access snapshot', async () => {
    const { service, prisma } = createService();
    const activeRole = createRole({
      id: 'role-active',
      code: 'tenant_admin',
      name: '租户管理员',
      sort: 10,
      menus: [
        {
          menu: createMenu({
            id: 6,
            parentId: 4,
            title: '部门管理',
            name: 'department',
            type: 2,
            path: '/systemManagement/system/department',
            menuKey: 'main_system_department',
            sort: 6
          })
        }
      ]
    });
    const disabledRole = createRole({
      id: 'role-disabled',
      code: 'tenant_member',
      name: '普通成员',
      sort: 20,
      status: false,
      menus: [{ menu: createMenu() }]
    });

    prisma.user.findFirst.mockResolvedValue(
      createUser({
        roles: [{ role: disabledRole }, { role: activeRole }]
      })
    );

    const response = await service.getAccess({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });

    expect(response.data.user.roleCodes).toEqual(['tenant_admin']);
    expect(response.data.user.menuCodeList).toEqual(['main_system_department']);
  });

  it('rejects login when password verification fails', async () => {
    const { service, prisma, passwordService } = createService();
    prisma.user.findFirst.mockResolvedValue(createUser());
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({
        username: 'admin',
        password: 'wrong-password'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED)
    );

    expect(passwordService.verify).toHaveBeenCalledWith(
      '123456',
      'wrong-password'
    );
  });

  it('upgrades legacy plaintext password to hash after successful login', async () => {
    const { service, prisma, passwordService, jwtService } = createService();
    prisma.user.findFirst.mockResolvedValue(createUser());
    prisma.user.update.mockResolvedValue({
      id: 'user-1'
    });
    passwordService.isHash.mockReturnValue(false);
    passwordService.hash.mockResolvedValue('argon2-hash-value');

    const response = await service.login({
      username: 'admin',
      password: '123456'
    });

    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(passwordService.hash).toHaveBeenCalledWith('123456');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 'user-1'
      },
      data: {
        password: 'argon2-hash-value'
      }
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });
    expect(response.code).toBe(200);
  });
});
