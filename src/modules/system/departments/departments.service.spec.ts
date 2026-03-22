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

  const createDepartment = (overrides: Partial<Record<string, unknown>> = {}) => ({
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
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: typeof prisma) => Promise<unknown>,
        _options?: unknown
      ) => callback(prisma)
    );

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
});
