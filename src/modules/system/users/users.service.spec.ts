import { Prisma } from '../../../generated/prisma';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DataScopeService } from '../../iam/data-scopes/data-scope.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    tenantId: 'tenant_001',
    departmentId: null,
    username: 'admin',
    nickname: '系统管理员',
    phone: '13800000000',
    email: 'admin@luckycolor.local',
    avatar: 'https://static.luckycolor.local/avatar/admin.png',
    status: true,
    lastLoginAt: new Date('2026-03-22T16:00:00.000Z'),
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
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      department: {
        findFirst: jest.fn()
      },
      user: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      role: {
        findMany: jest.fn()
      },
      userRole: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
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

  function createDataScopeServiceMock() {
    return {
      buildUserWhere: jest
        .fn()
        .mockImplementation(async (_user, where) => where)
    } as unknown as DataScopeService;
  }

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('returns assigned roles for a user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue({
      ...createUser(),
      roles: [
        {
          role: createRole({
            id: 'role-2',
            name: '租户管理员',
            code: 'tenant_admin',
            sort: 10
          })
        },
        {
          role: createRole()
        }
      ]
    });

    const response = await service.roles('user-1');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: 'user-1' }, { tenantId: 'tenant_001' }]
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        userId: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin',
        nickname: '系统管理员',
        roleIds: ['role-1', 'role-2'],
        roles: [
          {
            id: 'role-1',
            tenantId: 'tenant_001',
            name: '超级管理员',
            code: 'super_admin',
            sort: 1,
            status: true
          },
          {
            id: 'role-2',
            tenantId: 'tenant_001',
            name: '租户管理员',
            code: 'tenant_admin',
            sort: 10,
            status: true
          }
        ]
      }
    });
  });

  it('throws when assigning roles to a missing user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.assignRoles('missing-user', { roleIds: ['role-1'] })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND)
    );

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when any assigned role does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(createUser());
    prisma.role.findMany.mockResolvedValue([createRole()]);

    await expect(
      service.assignRoles('user-1', { roleIds: ['role-1', 'role-2'] })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND)
    );

    expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userRole.createMany).not.toHaveBeenCalled();
  });

  it('replaces user roles and returns the latest assignment result', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    const user = createUser();
    const roles = [
      createRole(),
      createRole({
        id: 'role-2',
        name: '租户管理员',
        code: 'tenant_admin',
        sort: 10
      })
    ];

    prisma.user.findFirst.mockResolvedValue(user);
    prisma.role.findMany.mockResolvedValue(roles);
    prisma.userRole.deleteMany.mockResolvedValue({ count: 1 });
    prisma.userRole.createMany.mockResolvedValue({ count: 2 });

    const response = await service.assignRoles('user-1', {
      roleIds: ['role-1', 'role-2']
    });

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: {
        AND: [{ id: { in: ['role-1', 'role-2'] } }, { tenantId: 'tenant_001' }]
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
    });
    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', tenantId: 'tenant_001' }
    });
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', roleId: 'role-1', tenantId: 'tenant_001' },
        { userId: 'user-1', roleId: 'role-2', tenantId: 'tenant_001' }
      ]
    });
    expect(response.data.roleIds).toEqual(['role-1', 'role-2']);
    expect(response.data.roles).toEqual([
      {
        id: 'role-1',
        tenantId: 'tenant_001',
        name: '超级管理员',
        code: 'super_admin',
        sort: 1,
        status: true
      },
      {
        id: 'role-2',
        tenantId: 'tenant_001',
        name: '租户管理员',
        code: 'tenant_admin',
        sort: 10,
        status: true
      }
    ]);
  });

  it('supports clearing all assigned roles', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(createUser());
    prisma.userRole.deleteMany.mockResolvedValue({ count: 2 });

    const response = await service.assignRoles('user-1', { roleIds: [] });

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', tenantId: 'tenant_001' }
    });
    expect(prisma.userRole.createMany).not.toHaveBeenCalled();
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        userId: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin',
        nickname: '系统管理员',
        roleIds: [],
        roles: []
      }
    });
  });

  it('hashes password before creating a user', async () => {
    const prisma = createPrismaMock();
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password')
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      passwordService as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.department.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(
      createUser({
        departmentId: 100,
        department: {
          id: 100,
          name: '总部',
          code: 'headquarters'
        },
        password: 'hashed-password'
      })
    );
    prisma.department.findFirst.mockResolvedValue({
      id: 100,
      tenantId: 'tenant_001',
      name: '总部',
      code: 'headquarters'
    });

    await service.create({
      username: 'new-user',
      password: 'plain-password',
      nickname: 'New User',
      departmentId: 100
    });

    expect(passwordService.hash).toHaveBeenCalledWith('plain-password');
    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: 100 }, { tenantId: 'tenant_001' }]
      }
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_001',
        departmentId: 100,
        username: 'new-user',
        password: 'hashed-password',
        nickname: 'New User',
        phone: null,
        email: null,
        avatar: null,
        status: true
      },
      include: {
        department: true
      }
    });
  });

  it('translates unique username conflicts into business errors on create', async () => {
    const prisma = createPrismaMock();
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password')
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      passwordService as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.department.findFirst.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(
      createUniqueConstraintError(['tenant_id', 'username'])
    );

    await expect(
      service.create({
        username: 'new-user',
        password: 'plain-password',
        nickname: 'New User'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });

  it('hashes password before updating a user password', async () => {
    const prisma = createPrismaMock();
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password-2')
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      passwordService as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(createUser())
      .mockResolvedValueOnce(null);
    prisma.department.findFirst.mockResolvedValue({
      id: 120,
      tenantId: 'tenant_001',
      name: '运营支持部',
      code: 'operations_support'
    });
    prisma.user.update.mockResolvedValue(
      createUser({
        departmentId: 120,
        department: {
          id: 120,
          name: '运营支持部',
          code: 'operations_support'
        },
        username: 'admin-updated',
        nickname: 'Updated User'
      })
    );

    await service.update('user-1', {
      username: 'admin-updated',
      password: 'new-plain-password',
      nickname: 'Updated User',
      departmentId: 120
    });

    expect(passwordService.hash).toHaveBeenCalledWith('new-plain-password');
    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: 120 }, { tenantId: 'tenant_001' }]
      }
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        username: 'admin-updated',
        password: 'hashed-password-2',
        nickname: 'Updated User',
        phone: undefined,
        email: undefined,
        avatar: undefined,
        status: undefined,
        departmentId: 120
      },
      include: {
        department: true
      }
    });
  });

  it('updates user status', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(createUser());
    prisma.user.update.mockResolvedValue(
      createUser({
        status: false,
        departmentId: 120,
        department: {
          id: 120,
          name: '运营支持部',
          code: 'operations_support'
        }
      })
    );

    const response = await service.updateStatus('user-1', {
      status: false
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        status: false
      },
      include: {
        department: true
      }
    });
    expect(response.data.status).toBe(false);
  });

  it('resets user password with hash', async () => {
    const prisma = createPrismaMock();
    const passwordService = {
      hash: jest.fn().mockResolvedValue('reset-password-hash')
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      passwordService as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(createUser());
    prisma.user.update.mockResolvedValue(createUser());

    const response = await service.resetPassword('user-1', {
      password: '654321'
    });

    expect(passwordService.hash).toHaveBeenCalledWith('654321');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        password: 'reset-password-hash'
      }
    });
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: true
    });
  });

  it('applies self data scope when querying user list', async () => {
    const prisma = createPrismaMock();
    const dataScopeService = createDataScopeServiceMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      dataScopeService
    );
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany = jest.fn().mockResolvedValue([
      createUser({
        departmentId: 100,
        department: {
          id: 100,
          name: '总部',
          code: 'headquarters'
        }
      })
    ]);
    dataScopeService.buildUserWhere = jest.fn().mockResolvedValue({
      AND: [{ username: { contains: 'admin' } }, { id: 'user-1' }]
    });

    const response = await service.list(
      {
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      },
      {
        page: 1,
        size: 10,
        keyword: 'admin'
      }
    );

    expect(dataScopeService.buildUserWhere).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      },
      {
        OR: [
          { username: { contains: 'admin' } },
          { nickname: { contains: 'admin' } },
          { phone: { contains: 'admin' } },
          { email: { contains: 'admin' } }
        ]
      }
    );
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            AND: [{ username: { contains: 'admin' } }, { id: 'user-1' }]
          },
          { tenantId: 'tenant_001' }
        ]
      }
    });
    expect(response.data.records).toHaveLength(1);
  });

  it('throws when creating user with missing department', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        username: 'new-user',
        password: 'plain-password',
        departmentId: 999
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND)
    );
  });

  it('applies status and created time filters when querying user list', async () => {
    const prisma = createPrismaMock();
    const dataScopeService = createDataScopeServiceMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      dataScopeService
    );
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([]);
    dataScopeService.buildUserWhere = jest
      .fn()
      .mockImplementation(async (_user, where) => where);

    await service.list(
      {
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      },
      {
        page: 1,
        size: 10,
        keyword: 'admin',
        status: false,
        departmentId: 100,
        createdAtStart: '2026-03-01T00:00:00.000Z',
        createdAtEnd: '2026-03-31T23:59:59.999Z'
      }
    );

    expect(dataScopeService.buildUserWhere).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      },
      {
        AND: [
          {
            OR: [
              { username: { contains: 'admin' } },
              { nickname: { contains: 'admin' } },
              { phone: { contains: 'admin' } },
              { email: { contains: 'admin' } }
            ]
          },
          { status: false },
          { departmentId: 100 },
          {
            createdAt: {
              gte: new Date('2026-03-01T00:00:00.000Z'),
              lte: new Date('2026-03-31T23:59:59.999Z')
            }
          }
        ]
      }
    );
  });

  it('rejects duplicate phone when creating a user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createUser({ id: 'user-2', phone: '13800000009' }));

    await expect(
      service.create({
        username: 'new-user',
        password: 'plain-password',
        phone: '13800000009'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate email when updating a user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      {
        hash: jest.fn()
      } as never,
      createDataScopeServiceMock()
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(createUser())
      .mockResolvedValueOnce(createUser({ id: 'user-2', email: 'dup@luckycolor.local' }));

    await expect(
      service.update('user-1', {
        email: 'dup@luckycolor.local'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
