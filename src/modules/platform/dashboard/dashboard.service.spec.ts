import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  function createPrismaMock() {
    const prisma = {
      user: {
        findFirst: jest.fn()
      },
      dashboardVisit: {
        findMany: jest.fn(),
        create: jest.fn()
      },
      notice: {
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (operations: Array<Promise<unknown>>) => Promise.all(operations)
    );

    return prisma;
  }

  it('keeps the latest visit when deduplicating recent routes', async () => {
    const prisma = createPrismaMock();
    const service = new DashboardService(prisma as never, createTenantScope());
    const newerVisitAt = new Date('2026-03-23T08:00:00.000Z');
    const olderVisitAt = new Date('2026-03-23T07:00:00.000Z');

    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin',
      nickname: '系统管理员'
    });
    prisma.dashboardVisit.findMany
      .mockResolvedValueOnce([{ visitorId: 'visitor-1' }])
      .mockResolvedValueOnce([{ sessionId: 'session-1' }])
      .mockResolvedValueOnce([
        {
          visitorId: 'visitor-1',
          visitedAt: newerVisitAt
        }
      ])
      .mockResolvedValueOnce([
        {
          routePath: '/dashboard',
          routeTitle: '新版首页',
          routeIcon: 'solar:home-2-linear',
          visitedAt: newerVisitAt
        },
        {
          routePath: '/dashboard',
          routeTitle: '旧版首页',
          routeIcon: 'solar:home-2-linear',
          visitedAt: olderVisitAt
        },
        {
          routePath: '/systemManagement/system/notice',
          routeTitle: '通知公告',
          routeIcon: 'solar:bell-linear',
          visitedAt: olderVisitAt
        }
      ]);
    prisma.notice.findMany.mockResolvedValue([]);

    const response = await service.overview({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });

    expect(response.data.recentVisits).toEqual([
      {
        routePath: '/dashboard',
        routeTitle: '新版首页',
        routeIcon: 'solar:home-2-linear',
        lastVisitedAt: newerVisitAt
      },
      {
        routePath: '/systemManagement/system/notice',
        routeTitle: '通知公告',
        routeIcon: 'solar:bell-linear',
        lastVisitedAt: olderVisitAt
      }
    ]);
  });

  it('falls back to latest notices when no published notice exists', async () => {
    const prisma = createPrismaMock();
    const service = new DashboardService(prisma as never, createTenantScope());
    const createdAt = new Date('2026-03-23T09:00:00.000Z');

    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin',
      nickname: '系统管理员'
    });
    prisma.dashboardVisit.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.notice.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'notice-1',
          title: '默认公告',
          content: '请先完成角色与菜单配置',
          type: 'system',
          status: false,
          publisher: '系统发布',
          publishedAt: null,
          createdAt
        }
      ]);

    const response = await service.overview({
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    });

    expect(response.data.notices).toEqual([
      {
        id: 'notice-1',
        title: '默认公告',
        content: '请先完成角色与菜单配置',
        type: 'system',
        status: false,
        publisher: '系统发布',
        publishedAt: null,
        createdAt
      }
    ]);
  });
});
