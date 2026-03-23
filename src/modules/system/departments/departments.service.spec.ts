import { Prisma } from '../../../generated/prisma';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createDepartment = (
    overrides: Partial<Record<string, unknown>> = {}
  ) => ({
    id: 101,
    tenantId: 'tenant_001',
    parentId: null,
    name: 'Headquarters',
    code: 'headquarters',
    leader: null,
    phone: null,
    email: null,
    sort: 101,
    status: true,
    remark: null,
    createdAt: new Date('2026-03-23T02:00:00.000Z'),
    updatedAt: new Date('2026-03-23T02:00:00.000Z'),
    ...overrides
  });

  function createPrismaMock() {
    const prisma = {
      department: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
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

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('uses created id as default sort when sort is omitted', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(null);
    prisma.department.findMany.mockResolvedValue([]);
    prisma.department.create.mockResolvedValue(
      createDepartment({
        sort: 0
      })
    );
    prisma.department.update.mockResolvedValue(createDepartment());

    const response = await service.create({
      name: 'Headquarters',
      code: 'headquarters'
    });

    expect(prisma.department.create).toHaveBeenCalledWith({
      data: {
        id: undefined,
        tenantId: 'tenant_001',
        parentId: null,
        name: 'Headquarters',
        code: 'headquarters',
        leader: null,
        phone: null,
        email: null,
        sort: 0,
        status: true,
        remark: null
      }
    });
    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: {
        sort: 101
      }
    });
    expect(response.data.id).toBe(101);
    expect(response.data.sort).toBe(101);
  });

  it('translates duplicate department code conflicts into business errors', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(null);
    prisma.department.findMany.mockResolvedValue([]);
    prisma.department.create.mockRejectedValue(
      createUniqueConstraintError(['tenant_id', 'code'])
    );

    await expect(
      service.create({
        name: 'Headquarters',
        code: 'headquarters'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });

  it('applies status filter when querying department list', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.count.mockResolvedValue(1);
    prisma.department.findMany.mockResolvedValue([
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product',
        status: false
      })
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: 'Product',
      status: false
    });

    expect(prisma.department.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: 'Product' } },
              { code: { contains: 'Product' } }
            ],
            status: false
          },
          {
            tenantId: 'tenant_001'
          }
        ]
      }
    });
    expect(response.data.records[0].status).toBe(false);
  });

  it('rejects create when parent department does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(null);
    prisma.department.findMany.mockResolvedValue([
      createDepartment({
        id: 100,
        name: 'Headquarters',
        code: 'headquarters'
      })
    ]);

    await expect(
      service.create({
        parentId: 999,
        name: 'Product',
        code: 'product'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND)
    );

    expect(prisma.department.create).not.toHaveBeenCalled();
  });

  it('rejects update when moving a department under itself', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product'
      })
    );
    prisma.department.findMany.mockResolvedValue([
      createDepartment({
        id: 100,
        name: 'Headquarters',
        code: 'headquarters'
      }),
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product'
      })
    ]);

    await expect(
      service.update(110, {
        parentId: 110
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID)
    );

    expect(prisma.department.update).not.toHaveBeenCalled();
  });

  it('rejects update when moving a department under its descendant', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(
      createDepartment({
        id: 100,
        parentId: null,
        name: 'Headquarters',
        code: 'headquarters'
      })
    );
    prisma.department.findMany.mockResolvedValue([
      createDepartment({
        id: 100,
        parentId: null,
        name: 'Headquarters',
        code: 'headquarters'
      }),
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product'
      }),
      createDepartment({
        id: 120,
        parentId: 110,
        name: 'Frontend',
        code: 'frontend'
      })
    ]);

    await expect(
      service.update(100, {
        parentId: 120
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID)
    );

    expect(prisma.department.update).not.toHaveBeenCalled();
  });

  it('updates department status', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findFirst.mockResolvedValue(
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product'
      })
    );
    prisma.department.update.mockResolvedValue(
      createDepartment({
        id: 110,
        parentId: 100,
        name: 'Product',
        code: 'product',
        status: false
      })
    );

    const response = await service.updateStatus(110, {
      status: false
    });

    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 110 },
      data: {
        status: false
      }
    });
    expect(response.data.status).toBe(false);
  });

  it('returns current and descendant department ids', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findMany.mockResolvedValue([
      { id: 100, parentId: null },
      { id: 110, parentId: 100 },
      { id: 120, parentId: 100 },
      { id: 121, parentId: 120 }
    ]);

    const response = await service.descendantIds(100);

    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant_001'
      },
      select: {
        id: true,
        parentId: true
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });
    expect(response.data).toEqual({
      departmentId: 100,
      departmentIds: [100, 110, 120, 121]
    });
  });

  it('throws when querying descendant ids for missing department', async () => {
    const prisma = createPrismaMock();
    const service = new DepartmentsService(
      prisma as never,
      createTenantScope()
    );

    prisma.department.findMany.mockResolvedValue([
      { id: 100, parentId: null },
      { id: 110, parentId: 100 }
    ]);

    await expect(service.descendantIds(999)).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND)
    );
  });
});
