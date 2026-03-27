import { TenantPackagesService } from './tenant-packages.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';

describe('TenantPackagesService', () => {
  function createPrismaMock() {
    const prisma = {
      $transaction: jest.fn(),
      tenantPackage: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      tenant: {
        count: jest.fn()
      }
    };

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return (input as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });

    return prisma;
  }

  it('lists tenant packages with standardized sorting params', async () => {
    const prisma = createPrismaMock();
    const service = new TenantPackagesService(prisma as never);
    prisma.tenantPackage.count.mockResolvedValue(1);
    prisma.tenantPackage.findMany.mockResolvedValue([
      {
        id: 'pkg_basic',
        code: 'basic',
        name: 'Basic',
        status: true,
        maxUsers: 50,
        maxRoles: 20,
        maxMenus: 100,
        featureFlags: null,
        remark: null,
        createdAt: new Date('2026-03-22T14:30:00.000Z'),
        updatedAt: new Date('2026-03-22T14:30:00.000Z')
      }
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: 'basic',
      status: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    expect(prisma.tenantPackage.findMany).toHaveBeenCalledWith({
      where: {
        status: true,
        OR: [
          { name: { contains: 'basic' } },
          { code: { contains: 'basic' } }
        ]
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
      skip: 0,
      take: 10
    });
    expect(response.data.records).toHaveLength(1);
  });

  it('creates tenant package with generated id when id is omitted', async () => {
    const prisma = createPrismaMock();
    const service = new TenantPackagesService(prisma as never);
    prisma.tenantPackage.create.mockResolvedValue({
      id: 'pkg_pro',
      code: 'pro',
      name: '专业版套餐',
      status: true,
      maxUsers: 200,
      maxRoles: 50,
      maxMenus: 300,
      featureFlags: {
        analytics: true
      },
      remark: '适用于成长型租户',
      createdAt: new Date('2026-03-23T09:30:00.000Z'),
      updatedAt: new Date('2026-03-23T09:30:00.000Z')
    });

    const response = await service.create({
      code: 'pro',
      name: '专业版套餐',
      status: true,
      maxUsers: 200,
      maxRoles: 50,
      maxMenus: 300,
      featureFlags: {
        analytics: true
      },
      remark: '适用于成长型租户'
    });

    expect(prisma.tenantPackage.create).toHaveBeenCalledWith({
      data: {
        id: 'pkg_pro',
        code: 'pro',
        name: '专业版套餐',
        status: true,
        maxUsers: 200,
        maxRoles: 50,
        maxMenus: 300,
        featureFlags: {
          analytics: true
        },
        remark: '适用于成长型租户'
      }
    });
    expect(response.data.id).toBe('pkg_pro');
    expect(response.data.code).toBe('pro');
  });

  it('updates tenant package by id', async () => {
    const prisma = createPrismaMock();
    const service = new TenantPackagesService(prisma as never);
    prisma.tenantPackage.findUnique.mockResolvedValue({
      id: 'pkg_basic',
      code: 'basic'
    });
    prisma.tenantPackage.update.mockResolvedValue({
      id: 'pkg_basic',
      code: 'basic',
      name: '基础版套餐 Plus',
      status: false,
      maxUsers: 80,
      maxRoles: 30,
      maxMenus: 150,
      featureFlags: {
        watermark: true
      },
      remark: null,
      createdAt: new Date('2026-03-22T14:30:00.000Z'),
      updatedAt: new Date('2026-03-23T10:00:00.000Z')
    });

    const response = await service.update('pkg_basic', {
      name: '基础版套餐 Plus',
      status: false,
      maxUsers: 80,
      maxRoles: 30,
      maxMenus: 150,
      featureFlags: {
        watermark: true
      },
      remark: null
    });

    expect(prisma.tenantPackage.update).toHaveBeenCalledWith({
      where: { id: 'pkg_basic' },
      data: {
        code: undefined,
        name: '基础版套餐 Plus',
        status: false,
        maxUsers: 80,
        maxRoles: 30,
        maxMenus: 150,
        featureFlags: {
          watermark: true
        },
        remark: null
      }
    });
    expect(response.data.name).toBe('基础版套餐 Plus');
    expect(response.data.status).toBe(false);
  });

  it('throws when deleting a tenant package that is still in use', async () => {
    const prisma = createPrismaMock();
    const service = new TenantPackagesService(prisma as never);
    prisma.tenantPackage.findUnique.mockResolvedValue({
      id: 'pkg_basic',
      code: 'basic'
    });
    prisma.tenant.count.mockResolvedValue(2);

    await expect(service.remove('pkg_basic')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_PACKAGE_IN_USE)
    );
    expect(prisma.tenantPackage.delete).not.toHaveBeenCalled();
  });

  it('deletes tenant package when it is not referenced by any tenant', async () => {
    const prisma = createPrismaMock();
    const service = new TenantPackagesService(prisma as never);
    prisma.tenantPackage.findUnique.mockResolvedValue({
      id: 'pkg_basic',
      code: 'basic'
    });
    prisma.tenant.count.mockResolvedValue(0);
    prisma.tenantPackage.delete.mockResolvedValue({
      id: 'pkg_basic'
    });

    const response = await service.remove('pkg_basic');

    expect(prisma.tenantPackage.delete).toHaveBeenCalledWith({
      where: { id: 'pkg_basic' }
    });
    expect(response.data).toBe(true);
  });
});
