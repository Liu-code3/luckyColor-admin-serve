import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const createUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    username: 'admin',
    nickname: '系统管理员',
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
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      user: {
        findUnique: jest.fn()
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
      async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma)
    );

    return prisma;
  }

  it('returns assigned roles for a user', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);
    prisma.user.findUnique.mockResolvedValue({
      ...createUser(),
      roles: [
        {
          role: createRole({ id: 'role-2', name: '租户管理员', code: 'tenant_admin', sort: 10 })
        },
        {
          role: createRole()
        }
      ]
    });

    const response = await service.roles('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
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
        username: 'admin',
        nickname: '系统管理员',
        roleIds: ['role-1', 'role-2'],
        roles: [
          {
            id: 'role-1',
            name: '超级管理员',
            code: 'super_admin',
            sort: 1,
            status: true
          },
          {
            id: 'role-2',
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
    const service = new UsersService(prisma as never);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.assignRoles('missing-user', { roleIds: ['role-1'] })
    ).rejects.toThrow(new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND));

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when any assigned role does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);
    prisma.user.findUnique.mockResolvedValue(createUser());
    prisma.role.findMany.mockResolvedValue([createRole()]);

    await expect(
      service.assignRoles('user-1', { roleIds: ['role-1', 'role-2'] })
    ).rejects.toThrow(new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND));

    expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userRole.createMany).not.toHaveBeenCalled();
  });

  it('replaces user roles and returns the latest assignment result', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);
    const user = createUser();
    const roles = [
      createRole(),
      createRole({ id: 'role-2', name: '租户管理员', code: 'tenant_admin', sort: 10 })
    ];

    prisma.user.findUnique.mockResolvedValue(user);
    prisma.role.findMany.mockResolvedValue(roles);
    prisma.userRole.deleteMany.mockResolvedValue({ count: 1 });
    prisma.userRole.createMany.mockResolvedValue({ count: 2 });

    const response = await service.assignRoles('user-1', {
      roleIds: ['role-1', 'role-2']
    });

    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' }
    });
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', roleId: 'role-1' },
        { userId: 'user-1', roleId: 'role-2' }
      ]
    });
    expect(response.data.roleIds).toEqual(['role-1', 'role-2']);
    expect(response.data.roles).toEqual([
      {
        id: 'role-1',
        name: '超级管理员',
        code: 'super_admin',
        sort: 1,
        status: true
      },
      {
        id: 'role-2',
        name: '租户管理员',
        code: 'tenant_admin',
        sort: 10,
        status: true
      }
    ]);
  });

  it('supports clearing all assigned roles', async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);
    prisma.user.findUnique.mockResolvedValue(createUser());
    prisma.userRole.deleteMany.mockResolvedValue({ count: 2 });

    const response = await service.assignRoles('user-1', { roleIds: [] });

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' }
    });
    expect(prisma.userRole.createMany).not.toHaveBeenCalled();
    expect(response).toEqual({
      code: 200,
      msg: 'success',
      data: {
        userId: 'user-1',
        username: 'admin',
        nickname: '系统管理员',
        roleIds: [],
        roles: []
      }
    });
  });
});
