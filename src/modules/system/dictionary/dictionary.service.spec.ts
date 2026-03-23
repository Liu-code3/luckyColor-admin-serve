import { DictionaryService } from './dictionary.service';

describe('DictionaryService', () => {
  function createService() {
    const prisma = {
      dictionary: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn()
      },
      $transaction: jest.fn()
    };
    const tenantScope = {
      buildWhere: jest.fn().mockImplementation((where) => where)
    };
    const dictionaryCacheService = {
      getTree: jest.fn(),
      refreshCache: jest.fn(),
      refreshCacheSafely: jest.fn()
    };
    const dictionaryTypesService = {
      toNode: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };
    const dictionaryItemsService = {
      findMany: jest.fn(),
      toNode: jest.fn(),
      buildForest: jest.fn(),
      collectIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return (input as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });

    return {
      service: new DictionaryService(
        prisma as never,
        tenantScope as never,
        dictionaryCacheService as never,
        dictionaryTypesService as never,
        dictionaryItemsService as never
      ),
      prisma,
      dictionaryCacheService,
      dictionaryTypesService,
      dictionaryItemsService
    };
  }

  it('delegates root dictionary creation to type service', async () => {
    const { service, dictionaryTypesService, dictionaryItemsService } =
      createService();
    dictionaryTypesService.create.mockResolvedValue({
      id: 'dict_type',
      parentId: null,
      weight: 1,
      name: '状态字典',
      tenantId: 'tenant_001',
      dictLabel: '状态字典',
      dictValue: 'STATUS',
      category: 'FRM',
      sortCode: 1,
      deleteFlag: '0'
    });
    dictionaryTypesService.toNode.mockReturnValue({
      id: 'dict_type',
      parentId: '0',
      weight: 1,
      name: '状态字典',
      tenantId: 'tenant_001',
      dictLabel: '状态字典',
      dictValue: 'STATUS',
      category: 'FRM',
      sortCode: 1,
      deleteFlag: '0'
    });

    const response = await service.create({
      weight: 1,
      name: '状态字典',
      dictLabel: '状态字典',
      dictValue: 'STATUS',
      category: 'FRM',
      sortCode: 1,
      deleteFlag: '0'
    });

    expect(dictionaryTypesService.create).toHaveBeenCalled();
    expect(dictionaryItemsService.create).not.toHaveBeenCalled();
    expect(response.data.parentId).toBe('0');
  });

  it('delegates child dictionary creation to item service', async () => {
    const { service, dictionaryTypesService, dictionaryItemsService } =
      createService();
    dictionaryItemsService.create.mockResolvedValue({
      id: 'dict_item',
      parentId: 'dict_type',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 10,
      deleteFlag: '0'
    });
    dictionaryItemsService.toNode.mockReturnValue({
      id: 'dict_item',
      parentId: 'dict_type',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 10,
      deleteFlag: '0'
    });

    const response = await service.create({
      parentId: 'dict_type',
      weight: 10,
      name: '启用',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 10,
      deleteFlag: '0'
    });

    expect(dictionaryItemsService.create).toHaveBeenCalled();
    expect(dictionaryTypesService.create).not.toHaveBeenCalled();
    expect(response.data.parentId).toBe('dict_type');
  });

  it('reads tree from cache service', async () => {
    const { service, dictionaryCacheService } = createService();
    dictionaryCacheService.getTree.mockResolvedValue([
      {
        id: 'dict_type',
        children: [expect.objectContaining({ id: 'dict_item' })]
      }
    ]);

    const response = await service.getTree();

    expect(dictionaryCacheService.getTree).toHaveBeenCalled();
    expect(response.data).toEqual([
      expect.objectContaining({
        id: 'dict_type'
      })
    ]);
  });

  it('refreshes cache after removing dictionary nodes', async () => {
    const { service, prisma, dictionaryItemsService, dictionaryCacheService } =
      createService();
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_type',
        parentId: null
      },
      {
        id: 'dict_item',
        parentId: 'dict_type'
      }
    ]);
    dictionaryItemsService.toNode.mockImplementation((item) => ({
      ...item,
      parentId: item.parentId ?? '0'
    }));
    dictionaryItemsService.collectIds.mockReturnValue(['dict_type', 'dict_item']);

    const response = await service.remove('dict_type');

    expect(prisma.dictionary.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['dict_type', 'dict_item'] }
      }
    });
    expect(dictionaryCacheService.refreshCacheSafely).toHaveBeenCalled();
    expect(response.data).toBe(true);
  });
});
