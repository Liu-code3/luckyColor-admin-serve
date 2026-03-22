import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthService } from './auth.service';

describe('AuthService', () => {
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
        findUnique: jest.fn()
      }
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token')
    };
    const configService = {
      get: jest.fn().mockReturnValue('2h')
    };

    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never
    );

    return {
      service,
      prisma,
      jwtService,
      configService
    };
  }

  it('returns permission summary in login response', async () => {
    const { service, prisma, jwtService } = createService();
    prisma.user.findUnique.mockResolvedValue(
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

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      username: 'admin'
    });
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        accessToken: 'signed-token',
        tokenType: 'Bearer',
        expiresIn: '2h',
        user: {
          id: 'user-1',
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

    prisma.user.findUnique.mockResolvedValue(
      createUser({
        roles: [{ role }, { role }]
      })
    );

    const response = await service.getAccess({
      sub: 'user-1',
      username: 'admin'
    });

    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        user: {
          id: 'user-1',
          username: 'admin',
          nickname: '系统管理员',
          roleCodes: ['super_admin'],
          menuCodeList: ['main_system', 'main_system_users'],
          buttonCodeList: ['system:user:create']
        },
        roles: [
          {
            id: 'role-1',
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
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getProfile({
        sub: 'missing-user',
        username: 'admin'
      })
    ).rejects.toThrow(new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID));
  });
});
