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
    const departmentsService = {
      findDescendantDepartmentIdsByTenant: jest.fn()
    };

    return {
      service: new DataScopeService(
        prisma as never,
        departmentsService as never
      ),
      prisma,
      departmentsService
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
      departmentId: 100,
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
      departmentIds: [],
      userDepartmentId: 100
    });
  });

  it('resolves custom scope and merges department ids', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 120,
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
      departmentIds: [100, 120, 130],
      userDepartmentId: 120
    });
  });

  it('builds self-only filter for self scope users', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 100,
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

  it('builds department-only filter for department scope users', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 120,
      roles: [createUserRole({ dataScope: 'DEPARTMENT' })]
    });

    await expect(
      service.buildUserWhere({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).resolves.toEqual({
      departmentId: 120
    });
  });

  it('builds department and children filter for descendant scope users', async () => {
    const { service, prisma, departmentsService } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 100,
      roles: [createUserRole({ dataScope: 'DEPARTMENT_AND_CHILDREN' })]
    });
    departmentsService.findDescendantDepartmentIdsByTenant.mockResolvedValue([
      100, 110, 120, 121
    ]);

    await expect(
      service.buildUserWhere({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).resolves.toEqual({
      departmentId: { in: [100, 110, 120, 121] }
    });
    expect(
      departmentsService.findDescendantDepartmentIdsByTenant
    ).toHaveBeenCalledWith('tenant_001', 100);
  });

  it('builds custom department filter for custom scope users', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 100,
      roles: [
        createUserRole({
          dataScope: 'CUSTOM',
          dataScopeDepartments: [{ departmentId: 100 }, { departmentId: 120 }]
        })
      ]
    });

    await expect(
      service.buildUserWhere({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).resolves.toEqual({
      departmentId: { in: [100, 120] }
    });
  });

  it('denies department scope when current user has no bound department', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: null,
      roles: [createUserRole({ dataScope: 'DEPARTMENT' })]
    });

    await expect(
      service.buildUserWhere({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED)
    );
  });
});
