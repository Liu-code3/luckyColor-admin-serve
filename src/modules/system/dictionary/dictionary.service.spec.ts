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
    const dictionaryTypesService = {
      findMany: jest.fn(),
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
        dictionaryTypesService as never,
        dictionaryItemsService as never
      ),
      prisma,
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

  it('assembles tree from type and item services', async () => {
    const { service, dictionaryTypesService, dictionaryItemsService } =
      createService();
    dictionaryTypesService.findMany.mockResolvedValue([
      {
        id: 'dict_type',
        parentId: null
      }
    ]);
    dictionaryItemsService.findMany.mockResolvedValue([
      {
        id: 'dict_item',
        parentId: 'dict_type'
      }
    ]);
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
    dictionaryItemsService.buildForest.mockReturnValue(
      new Map([
        [
          'dict_type',
          [
            {
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
            }
          ]
        ]
      ])
    );

    const response = await service.getTree();

    expect(dictionaryTypesService.findMany).toHaveBeenCalled();
    expect(dictionaryItemsService.findMany).toHaveBeenCalled();
    expect(response.data).toEqual([
      expect.objectContaining({
        id: 'dict_type',
        children: [expect.objectContaining({ id: 'dict_item' })]
      })
    ]);
  });
});
