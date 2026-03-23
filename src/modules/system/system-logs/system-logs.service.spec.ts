import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { SystemLogsService } from './system-logs.service';

describe('SystemLogsService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  function createPrismaMock() {
    const prisma = {
      systemLog: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn()
      },
      user: {
        findFirst: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (operations: Array<Promise<unknown>>) => Promise.all(operations)
    );

    return prisma;
  }

  it('creates a system log with request-derived client info', async () => {
    const prisma = createPrismaMock();
    const service = new SystemLogsService(prisma as never, createTenantScope());
    const createdAt = new Date('2026-03-23T03:30:00.000Z');

    prisma.user.findFirst.mockResolvedValue({
      nickname: '系统管理员'
    });
    prisma.systemLog.create.mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant_001',
      operatorUserId: 'user-1',
      operatorName: '系统管理员',
      module: '用户管理',
      content: '删除了用户 admin-test',
      ipAddress: '127.0.0.1',
      region: '上海市',
      browserVersion: 'Chrome 123.0.0.0',
      terminalSystem: 'Windows',
      createdAt,
      updatedAt: createdAt
    });

    const response = await service.create(
      {
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      },
      {
        module: '  用户管理  ',
        content: ' 删除了用户 admin-test ',
        region: ' 上海市 '
      },
      {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'x-forwarded-for': '127.0.0.1, 10.0.0.1'
        }
      }
    );

    expect(prisma.systemLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_001',
        operatorUserId: 'user-1',
        operatorName: '系统管理员',
        module: '用户管理',
        content: '删除了用户 admin-test',
        ipAddress: '127.0.0.1',
        region: '上海市',
        browserVersion: 'Chrome 123.0.0.0',
        terminalSystem: 'Windows'
      }
    });
    expect(response.data).toEqual({
      id: 'log-1',
      tenantId: 'tenant_001',
      operatorUserId: 'user-1',
      operatorName: '系统管理员',
      module: '用户管理',
      content: '删除了用户 admin-test',
      ipAddress: '127.0.0.1',
      region: '上海市',
      browserVersion: 'Chrome 123.0.0.0',
      terminalSystem: 'Windows',
      createdAt,
      updatedAt: createdAt
    });
  });

  it('throws when system log detail is missing', async () => {
    const prisma = createPrismaMock();
    const service = new SystemLogsService(prisma as never, createTenantScope());
    prisma.systemLog.findFirst.mockResolvedValue(null);

    await expect(service.detail('missing-log')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.SYSTEM_LOG_NOT_FOUND)
    );
  });
});
