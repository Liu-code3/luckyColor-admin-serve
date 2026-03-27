import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { NoticesService } from './notices.service';

describe('NoticesService', () => {
  function createService() {
    const prisma = {
      notice: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      user: {
        findFirst: jest.fn()
      },
      $transaction: jest.fn()
    };
    const tenantScope = {
      buildRequiredWhere: jest.fn().mockImplementation((where) => where ?? {}),
      buildRequiredData: jest.fn().mockImplementation((data) => ({
        ...data,
        tenantId: 'tenant_001'
      }))
    };

    prisma.$transaction.mockImplementation(async (input: unknown[]) =>
      Promise.all(input as Promise<unknown>[])
    );

    return {
      service: new NoticesService(prisma as never, tenantScope as never),
      prisma,
      tenantScope
    };
  }

  function createNotice(overrides: Record<string, unknown> = {}) {
    return {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: 'Release Update Reminder',
      content: 'Review role permissions before the new release arrives.',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: null,
      targetRoleCodes: '|tenant_admin|',
      isPinned: false,
      publisher: 'Product Team',
      scheduledPublishAt: new Date('2026-03-28T08:00:00.000Z'),
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: '{"channel":"dashboard"}',
      createdAt: new Date('2026-03-22T14:30:00.000Z'),
      updatedAt: new Date('2026-03-22T14:30:00.000Z'),
      ...overrides
    };
  }

  it('lists notices with filters and pinned ordering', async () => {
    const { service, prisma } = createService();
    prisma.notice.count.mockResolvedValue(1);
    prisma.notice.findMany.mockResolvedValue([
      createNotice({
        isPinned: true
      })
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: 'Release',
      type: 'release',
      status: false,
      publishScope: 'ROLE'
    });

    expect(prisma.notice.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { title: { contains: 'Release' } },
          { type: 'release' },
          { status: false },
          { publishScope: 'ROLE' }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
        { scheduledPublishAt: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: 0,
      take: 10
    });
    expect(response.data.records[0]).toEqual(
      expect.objectContaining({
        publishScope: 'ROLE',
        targetRoleCodes: ['tenant_admin'],
        isPinned: true
      })
    );
  });

  it('creates notices with scoped targets and event payload', async () => {
    const { service, prisma, tenantScope } = createService();
    prisma.notice.create.mockResolvedValue(
      createNotice({
        status: true,
        publishedAt: new Date('2026-03-28T08:00:00.000Z')
      })
    );

    const response = await service.create({
      title: 'Release Update Reminder',
      content: 'Review role permissions before the new release arrives.',
      type: 'release',
      status: true,
      publishScope: 'ROLE',
      targetRoleCodes: ['tenant_admin'],
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' }
    });

    expect(tenantScope.buildRequiredData).toHaveBeenCalledWith(
      expect.objectContaining({
        publishScope: 'ROLE',
        targetRoleCodes: '|tenant_admin|',
        scheduledPublishAt: new Date('2026-03-28T08:00:00.000Z'),
        publishedAt: new Date('2026-03-28T08:00:00.000Z'),
        eventPayload: '{"channel":"dashboard"}'
      })
    );
    expect(response.data.eventPayload).toEqual({ channel: 'dashboard' });
  });

  it('updates notices and keeps published time aligned with schedule', async () => {
    const { service, prisma } = createService();
    prisma.notice.findFirst.mockResolvedValue(
      createNotice({
        status: false,
        publishedAt: null
      })
    );
    prisma.notice.update.mockResolvedValue(
      createNotice({
        status: true,
        isPinned: true,
        targetDepartmentIds: '|100|120|',
        targetRoleCodes: null,
        publishScope: 'DEPARTMENT',
        publishedAt: new Date('2026-03-29T08:00:00.000Z'),
        scheduledPublishAt: new Date('2026-03-29T08:00:00.000Z')
      })
    );

    const response = await service.update('notice_1', {
      status: true,
      publishScope: 'DEPARTMENT',
      targetDepartmentIds: [100, 120],
      targetRoleCodes: null,
      isPinned: true,
      scheduledPublishAt: '2026-03-29T08:00:00.000Z'
    });

    expect(prisma.notice.update).toHaveBeenCalledWith({
      where: { id: 'notice_1' },
      data: expect.objectContaining({
        publishScope: 'DEPARTMENT',
        targetDepartmentIds: '|100|120|',
        targetRoleCodes: null,
        isPinned: true,
        scheduledPublishAt: new Date('2026-03-29T08:00:00.000Z'),
        publishedAt: new Date('2026-03-29T08:00:00.000Z')
      })
    });
    expect(response.data.targetDepartmentIds).toEqual([100, 120]);
  });

  it('publishes, revokes, and pins notices through dedicated transitions', async () => {
    const { service, prisma } = createService();
    prisma.notice.findFirst.mockResolvedValue(createNotice());
    prisma.notice.update
      .mockResolvedValueOnce(
        createNotice({
          status: true,
          publishedAt: new Date('2026-03-28T08:00:00.000Z')
        })
      )
      .mockResolvedValueOnce(
        createNotice({
          status: false,
          publishedAt: null
        })
      )
      .mockResolvedValueOnce(
        createNotice({
          isPinned: true
        })
      );

    const published = await service.publish('notice_1', {
      publisher: 'Product Team',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z'
    });
    const revoked = await service.revoke('notice_1');
    const pinned = await service.pin('notice_1', { pinned: true });

    expect(published.data.status).toBe(true);
    expect(revoked.data.status).toBe(false);
    expect(pinned.data.isPinned).toBe(true);
  });

  it('returns visible notices for users by role and department scope', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      departmentId: 120,
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true
          }
        }
      ]
    });
    prisma.notice.findMany.mockResolvedValueOnce([
      createNotice({
        status: true,
        isPinned: true,
        publishedAt: new Date('2026-03-28T08:00:00.000Z')
      })
    ]);

    const notices = await service.listVisibleForUser(
      {
        sub: 'user_1',
        tenantId: 'tenant_001'
      },
      4
    );

    expect(prisma.notice.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { status: true },
          {
            publishedAt: {
              lte: expect.any(Date)
            }
          },
          {
            OR: [
              { publishScope: 'TENANT_ALL' },
              {
                publishScope: 'DEPARTMENT',
                targetDepartmentIds: { contains: '|120|' }
              },
              {
                publishScope: 'ROLE',
                targetRoleCodes: { contains: '|tenant_admin|' }
              }
            ]
          }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 4
    });
    expect(notices[0].targetRoleCodes).toEqual(['tenant_admin']);
  });

  it('throws when notice does not exist', async () => {
    const { service, prisma } = createService();
    prisma.notice.findFirst.mockResolvedValue(null);

    await expect(service.detail('missing')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND)
    );
  });
});
