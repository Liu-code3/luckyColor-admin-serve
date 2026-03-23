import { DictionaryService } from './dictionary.service';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';

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
      buildWhere: jest.fn().mockImplementation((where) => where),
      getTenantId: jest.fn().mockReturnValue('tenant_001')
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

  function createTypeNode(overrides: Record<string, unknown> = {}) {
    return {
      id: 'dict_common_status',
      parentId: '0',
      weight: 1,
      name: '通用状态',
      tenantId: null,
      dictLabel: '通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'system_status',
      sortCode: 1,
      status: true,
      deleteFlag: '0',
      createTime: null,
      createUser: null,
      updateTime: null,
      updateUser: null,
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
      updatedAt: new Date('2026-03-24T10:00:00.000Z'),
      ...overrides
    };
  }

  function createItemNode(overrides: Record<string, unknown> = {}) {
    return {
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: null,
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'system_status',
      sortCode: 10,
      status: true,
      deleteFlag: '0',
      createTime: null,
      createUser: null,
      updateTime: null,
      updateUser: null,
      createdAt: new Date('2026-03-24T10:00:00.000Z'),
      updatedAt: new Date('2026-03-24T10:00:00.000Z'),
      ...overrides
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

  it('returns enabled options from cache tree by type code', async () => {
    const { service, dictionaryCacheService } = createService();
    dictionaryCacheService.getTree.mockResolvedValue([
      {
        ...createTypeNode(),
        children: [
          createItemNode(),
          createItemNode({
            id: 'dict_disabled',
            dictLabel: '停用',
            dictValue: 'DISABLED',
            sortCode: 20,
            status: false
          }),
          createItemNode({
            id: 'dict_pending',
            dictLabel: '待审核',
            dictValue: 'PENDING',
            sortCode: 30,
            children: [
              createItemNode({
                id: 'dict_pending_manual',
                parentId: 'dict_pending',
                dictLabel: '人工审核',
                dictValue: 'MANUAL',
                sortCode: 31
              })
            ]
          })
        ]
      }
    ]);

    const response = await service.getOptionsByTypeCode('COMMON_STATUS');

    expect(dictionaryCacheService.getTree).toHaveBeenCalled();
    expect(response.data).toEqual({
      typeId: 'dict_common_status',
      typeLabel: '通用状态',
      typeCode: 'COMMON_STATUS',
      category: 'system_status',
      options: [
        {
          label: '启用',
          value: 'ENABLE'
        },
        {
          label: '待审核',
          value: 'PENDING',
          children: [
            {
              label: '人工审核',
              value: 'MANUAL'
            }
          ]
        }
      ]
    });
  });

  it('merges tenant options with global dictionary options', async () => {
    const { service, dictionaryCacheService } = createService();
    dictionaryCacheService.getTree.mockResolvedValue([
      {
        ...createTypeNode({
          id: 'dict_common_status_global'
        }),
        children: [
          createItemNode(),
          createItemNode({
            id: 'dict_disabled_global',
            dictLabel: '停用',
            dictValue: 'DISABLED',
            sortCode: 20
          })
        ]
      },
      {
        ...createTypeNode({
          id: 'dict_common_status_tenant',
          tenantId: 'tenant_001',
          dictLabel: '租户状态'
        }),
        children: [
          createItemNode({
            id: 'dict_disabled_tenant',
            tenantId: 'tenant_001',
            dictLabel: '禁用',
            dictValue: 'DISABLED',
            sortCode: 20
          }),
          createItemNode({
            id: 'dict_archived_tenant',
            tenantId: 'tenant_001',
            dictLabel: '归档',
            dictValue: 'ARCHIVED',
            sortCode: 30
          })
        ]
      }
    ]);

    const response = await service.getOptionsByTypeCode('COMMON_STATUS');

    expect(response.data).toEqual({
      typeId: 'dict_common_status_tenant',
      typeLabel: '租户状态',
      typeCode: 'COMMON_STATUS',
      category: 'system_status',
      options: [
        {
          label: '启用',
          value: 'ENABLE'
        },
        {
          label: '禁用',
          value: 'DISABLED'
        },
        {
          label: '归档',
          value: 'ARCHIVED'
        }
      ]
    });
  });

  it('throws not found when type code does not exist', async () => {
    const { service, dictionaryCacheService } = createService();
    dictionaryCacheService.getTree.mockResolvedValue([]);

    await expect(service.getOptionsByTypeCode('UNKNOWN_CODE')).rejects.toMatchObject({
      code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
    });
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
