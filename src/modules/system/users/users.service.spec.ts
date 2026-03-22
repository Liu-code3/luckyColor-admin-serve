import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    tenantId: 'tenant_001',
    username: 'admin',
    nickname: '系统管理员',
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
      user: {
        findFirst: jest.fn(),
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

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
    );

    return prisma;
  }

  it('returns assigned roles for a user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never, createTenantScope(), {
      hash: jest.fn()
    } as never);
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
    const service = new UsersService(prisma as never, createTenantScope(), {
      hash: jest.fn()
    } as never);
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
    const service = new UsersService(prisma as never, createTenantScope(), {
      hash: jest.fn()
    } as never);
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
    const service = new UsersService(prisma as never, createTenantScope(), {
      hash: jest.fn()
    } as never);
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
    const service = new UsersService(prisma as never, createTenantScope(), {
      hash: jest.fn()
    } as never);
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
      passwordService as never
    );
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(
      createUser({
        password: 'hashed-password'
      })
    );

    await service.create({
      username: 'new-user',
      password: 'plain-password',
      nickname: 'New User'
    });

    expect(passwordService.hash).toHaveBeenCalledWith('plain-password');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_001',
        username: 'new-user',
        password: 'hashed-password',
        nickname: 'New User'
      }
    });
  });

  it('hashes password before updating a user password', async () => {
    const prisma = createPrismaMock();
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password-2')
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope(),
      passwordService as never
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(createUser())
      .mockResolvedValueOnce(null);
    prisma.user.update.mockResolvedValue(
      createUser({
        username: 'admin-updated',
        nickname: 'Updated User'
      })
    );

    await service.update('user-1', {
      username: 'admin-updated',
      password: 'new-plain-password',
      nickname: 'Updated User'
    });

    expect(passwordService.hash).toHaveBeenCalledWith('new-plain-password');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        username: 'admin-updated',
        password: 'hashed-password-2',
        nickname: 'Updated User'
      }
    });
  });
});
