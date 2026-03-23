import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DataScopeService } from './data-scope.service';

describe('DataScopeService', () => {
  function createService() {
    const prisma = {
      user: {
        findFirst: jest.fn()
      }
    };

    return {
      service: new DataScopeService(prisma as never),
      prisma
    };
  }

  function createUserRole(role: Partial<Record<string, unknown>>) {
    return {
      role: {
        code: 'tenant_admin',
        status: true,
        dataScope: 'SELF',
        dataScopeDepartments: [],
        ...role
      }
    };
  }

  it('resolves all scope for super admin', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      roles: [createUserRole({ code: 'super_admin', dataScope: 'SELF' })]
    });

    await expect(
      service.resolveProfile({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).resolves.toEqual({
      scope: 'ALL',
      departmentIds: []
    });
  });

  it('resolves custom scope and merges department ids', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        createUserRole({
          dataScope: 'CUSTOM',
          dataScopeDepartments: [{ departmentId: 120 }, { departmentId: 100 }]
        }),
        createUserRole({
          dataScope: 'CUSTOM',
          dataScopeDepartments: [{ departmentId: 120 }, { departmentId: 130 }]
        })
      ]
    });

    await expect(
      service.resolveProfile({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).resolves.toEqual({
      scope: 'CUSTOM',
      departmentIds: [100, 120, 130]
    });
  });

  it('builds self-only filter for self scope users', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      roles: [createUserRole({ dataScope: 'SELF' })]
    });

    await expect(
      service.buildUserWhere(
        {
          sub: 'user-1',
          tenantId: 'tenant_001',
          username: 'admin'
        },
        {
          username: { contains: 'admin' }
        }
      )
    ).resolves.toEqual({
      AND: [{ username: { contains: 'admin' } }, { id: 'user-1' }]
    });
  });

  it('rejects department-based user scope when user model lacks department binding', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        createUserRole({
          dataScope: 'CUSTOM',
          dataScopeDepartments: [{ departmentId: 100 }]
        })
      ]
    });

    await expect(
      service.buildUserWhere({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID)
    );
  });
});
