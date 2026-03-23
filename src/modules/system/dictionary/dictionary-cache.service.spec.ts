import { DictionaryCacheService } from './dictionary-cache.service';

describe('DictionaryCacheService', () => {
  function createService() {
    const prisma = {
      dictionary: {
        findMany: jest.fn()
      }
    };
    const redisClient = {
      status: 'ready',
      get: jest.fn(),
      set: jest.fn(),
      connect: jest.fn()
    };
    const redisService = {
      getClient: jest.fn().mockReturnValue(redisClient)
    };
    const tenantScope = {
      getTenantId: jest.fn().mockReturnValue('tenant_001'),
      buildWhere: jest.fn().mockImplementation((where) => where)
    };

    return {
      service: new DictionaryCacheService(
        prisma as never,
        redisService as never,
        tenantScope as never
      ),
      prisma,
      redisClient
    };
  }

  it('loads tree from cache when snapshot exists', async () => {
    const { service, redisClient, prisma } = createService();
    redisClient.get.mockResolvedValue(
      JSON.stringify({
        cacheKey: 'system:dictionaries:tree:tenant_001',
        count: 1,
        refreshedAt: '2026-03-24T10:00:00.000Z',
        tree: [{ id: 'dict_common_status', parentId: '0' }]
      })
    );

    const result = await service.getTree();

    expect(prisma.dictionary.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'dict_common_status', parentId: '0' }]);
  });

  it('rebuilds and writes cache when cache is missing', async () => {
    const { service, redisClient, prisma } = createService();
    redisClient.get.mockResolvedValue(null);
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_common_status',
        parentId: null,
        weight: 10,
        name: '系统通用状态',
        tenantId: 'tenant_001',
        dictLabel: '系统通用状态',
        dictValue: 'COMMON_STATUS',
        category: 'FRM',
        sortCode: 10,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
        updatedAt: new Date('2026-03-24T10:00:00.000Z')
      },
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status',
        weight: 20,
        name: '启用',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'ENABLE',
        category: 'FRM',
        sortCode: 20,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-24T10:00:00.000Z'),
        updatedAt: new Date('2026-03-24T10:00:00.000Z')
      }
    ]);

    const result = await service.getTree();

    expect(prisma.dictionary.findMany).toHaveBeenCalled();
    expect(redisClient.set).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        id: 'dict_common_status',
        children: [expect.objectContaining({ id: 'dict_enabled' })]
      })
    ]);
  });
});
