import { I18nService } from './i18n.service';

describe('I18nService', () => {
  function createService() {
    const prisma = {
      i18nResource: {
        findMany: jest.fn()
      }
    };

    return {
      service: new I18nService(prisma as never),
      prisma
    };
  }

  function createResource(overrides: Record<string, unknown> = {}) {
    return {
      id: 'res_1',
      languageCode: 'zh-CN',
      module: 'auth',
      resourceGroup: 'login',
      resourceKey: 'title',
      resourceValue: '欢迎登录 LuckyColor',
      version: 1,
      status: true,
      createdAt: new Date('2026-03-25T00:00:00.000Z'),
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
      ...overrides
    };
  }

  it('pulls enabled resources by language and module', async () => {
    const { service, prisma } = createService();
    prisma.i18nResource.findMany.mockResolvedValue([
      createResource(),
      createResource({
        id: 'res_2',
        resourceKey: 'submit',
        resourceValue: '立即登录',
        updatedAt: new Date('2026-03-26T00:00:00.000Z')
      })
    ]);

    const response = await service.pullResources({
      languageCode: 'zh-CN',
      module: 'auth'
    });

    expect(prisma.i18nResource.findMany).toHaveBeenCalledWith({
      where: {
        AND: [{ languageCode: 'zh-CN' }, { status: true }, { module: 'auth' }]
      },
      orderBy: [
        { module: 'asc' },
        { resourceGroup: 'asc' },
        { resourceKey: 'asc' }
      ]
    });
    expect(response.data.version).toBe(1);
    expect(response.data.updatedAt).toEqual(new Date('2026-03-26T00:00:00.000Z'));
    expect(response.data.records).toHaveLength(2);
  });

  it('supports incremental pulling by update timestamp', async () => {
    const { service, prisma } = createService();
    prisma.i18nResource.findMany.mockResolvedValue([
      createResource({
        id: 'res_2',
        resourceKey: 'submit',
        updatedAt: new Date('2026-03-26T00:00:00.000Z')
      })
    ]);

    const response = await service.pullResources({
      languageCode: 'zh-CN',
      updatedAfter: '2026-03-25T12:00:00.000Z'
    });

    expect(prisma.i18nResource.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { languageCode: 'zh-CN' },
          { status: true },
          {
            updatedAt: {
              gt: new Date('2026-03-25T12:00:00.000Z')
            }
          }
        ]
      },
      orderBy: [
        { module: 'asc' },
        { resourceGroup: 'asc' },
        { resourceKey: 'asc' }
      ]
    });
    expect(response.data.records[0].resourceKey).toBe('submit');
  });

  it('returns an empty result when no resources match', async () => {
    const { service, prisma } = createService();
    prisma.i18nResource.findMany.mockResolvedValue([]);

    const response = await service.pullResources({
      languageCode: 'en-US',
      module: 'dashboard'
    });

    expect(response.data).toEqual({
      languageCode: 'en-US',
      module: 'dashboard',
      version: 0,
      updatedAt: null,
      records: []
    });
  });
});
