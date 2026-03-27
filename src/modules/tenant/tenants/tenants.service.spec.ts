import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  function createTenant(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'tenant_001',
      code: 'default',
      name: 'Default Tenant',
      status: 'ACTIVE',
      expiresAt: new Date('2027-03-22T00:00:00.000Z'),
      contactName: 'Alice',
      contactPhone: '13800000000',
      contactEmail: 'alice@default.local',
      packageId: 'pkg_basic',
      remark: 'initial tenant',
      createdAt: new Date('2026-03-22T14:30:00.000Z'),
      updatedAt: new Date('2026-03-22T14:30:00.000Z'),
      tenantPackage: {
        id: 'pkg_basic',
        code: 'basic',
        name: 'Basic',
        status: true
      },
      ...overrides
    };
  }

  function createPrismaMock() {
    const prisma = {
      tenant: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      tenantPackage: {
        findUnique: jest.fn()
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

  it('lists tenants with standardized sorting params', async () => {
    const prisma = createPrismaMock();
    const service = new TenantsService(
      prisma as never,
      { initializeTenant: jest.fn() } as never,
      { recordMany: jest.fn() } as never
    );
    prisma.tenant.count.mockResolvedValue(1);
    prisma.tenant.findMany.mockResolvedValue([createTenant()]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: 'default',
      status: 'ACTIVE',
      sortBy: 'name',
      sortOrder: 'asc'
    });

    expect(prisma.tenant.findMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: 'default' } },
          { code: { contains: 'default' } }
        ]
      },
      include: {
        tenantPackage: true
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      skip: 0,
      take: 10
    });
    expect(response.data.records).toHaveLength(1);
  });

  it('updates tenant and records structured audit entries for changed fields', async () => {
    const prisma = createPrismaMock();
    const tenantAudit = {
      recordMany: jest.fn().mockResolvedValue(undefined)
    };
    const service = new TenantsService(
      prisma as never,
      { initializeTenant: jest.fn() } as never,
      tenantAudit as never
    );

    prisma.tenant.findUnique
      .mockResolvedValueOnce(createTenant())
      .mockResolvedValueOnce(
        createTenant({
          name: 'Default Tenant Pro',
          status: 'FROZEN',
          expiresAt: new Date('2027-06-30T00:00:00.000Z'),
          contactPhone: '13900000000',
          packageId: 'pkg_pro',
          remark: 'renewed',
          tenantPackage: {
            id: 'pkg_pro',
            code: 'pro',
            name: 'Pro',
            status: true
          }
        })
      );
    prisma.tenantPackage.findUnique.mockResolvedValue({
      id: 'pkg_pro',
      code: 'pro',
      name: 'Pro',
      status: true
    });
    prisma.tenant.update.mockResolvedValue({ id: 'tenant_001' });

    const response = await service.update('tenant_001', {
      name: 'Default Tenant Pro',
      status: 'FROZEN',
      expiresAt: '2027-06-30T00:00:00.000Z',
      contactPhone: '13900000000',
      packageId: 'pkg_pro',
      remark: 'renewed'
    });

    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant_001' },
      data: {
        name: 'Default Tenant Pro',
        status: 'FROZEN',
        expiresAt: new Date('2027-06-30T00:00:00.000Z'),
        contactName: undefined,
        contactPhone: '13900000000',
        contactEmail: undefined,
        packageId: 'pkg_pro',
        remark: 'renewed'
      }
    });
    expect(tenantAudit.recordMany).toHaveBeenCalledWith(
      [
        {
          tenantId: 'tenant_001',
          action: 'STATUS_CHANGED',
          detail: {
            field: 'status',
            before: 'ACTIVE',
            after: 'FROZEN'
          }
        },
        {
          tenantId: 'tenant_001',
          action: 'EXPIRES_AT_CHANGED',
          detail: {
            field: 'expiresAt',
            before: '2027-03-22T00:00:00.000Z',
            after: '2027-06-30T00:00:00.000Z'
          }
        },
        {
          tenantId: 'tenant_001',
          action: 'PACKAGE_CHANGED',
          detail: {
            before: {
              id: 'pkg_basic',
              code: 'basic',
              name: 'Basic'
            },
            after: {
              id: 'pkg_pro',
              code: 'pro',
              name: 'Pro'
            }
          }
        },
        {
          tenantId: 'tenant_001',
          action: 'UPDATED',
          detail: {
            fields: [
              {
                field: 'name',
                before: 'Default Tenant',
                after: 'Default Tenant Pro'
              },
              {
                field: 'contactPhone',
                before: '13800000000',
                after: '13900000000'
              },
              {
                field: 'remark',
                before: 'initial tenant',
                after: 'renewed'
              }
            ]
          }
        }
      ],
      prisma
    );
    expect(response.data.tenantPackage).toEqual({
      id: 'pkg_pro',
      code: 'pro',
      name: 'Pro',
      status: true
    });
  });

  it('throws when tenant package does not exist during update', async () => {
    const prisma = createPrismaMock();
    const service = new TenantsService(
      prisma as never,
      { initializeTenant: jest.fn() } as never,
      { recordMany: jest.fn() } as never
    );
    prisma.tenant.findUnique.mockResolvedValue(createTenant());
    prisma.tenantPackage.findUnique.mockResolvedValue(null);

    await expect(
      service.update('tenant_001', {
        packageId: 'pkg_missing'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND)
    );
  });
});
