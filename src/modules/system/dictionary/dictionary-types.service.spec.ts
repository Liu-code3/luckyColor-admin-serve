import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DictionaryTypesService } from './dictionary-types.service';

describe('DictionaryTypesService', () => {
  function createService() {
    const prisma = {
      dictionary: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn()
      },
      $transaction: jest.fn()
    };
    const tenantScope = {
      buildWhere: jest.fn().mockImplementation((where) => where),
      resolveTenantValue: jest
        .fn()
        .mockImplementation((value?: string | null) => value ?? 'tenant_001')
    };
    const dictionaryItemsService = {
      toNode: jest.fn().mockImplementation((item) => ({
        ...item,
        parentId: item.parentId ?? '0'
      })),
      collectIds: jest.fn()
    };

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return (input as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });

    return {
      service: new DictionaryTypesService(
        prisma as never,
        tenantScope as never,
        dictionaryItemsService as never
      ),
      prisma,
      tenantScope,
      dictionaryItemsService
    };
  }

  it('lists only root dictionary types with pagination', async () => {
    const { service, prisma } = createService();
    const createdAt = new Date('2026-03-22T10:00:00.000Z');
    const updatedAt = new Date('2026-03-22T11:00:00.000Z');
    prisma.dictionary.count.mockResolvedValue(2);
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
        sortCode: 100,
        deleteFlag: 'NOT_DELETE',
        createTime: '2026-03-22 10:00:00',
        createUser: 'admin',
        updateTime: '2026-03-22 11:00:00',
        updateUser: 'admin',
        createdAt,
        updatedAt
      }
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: '状态',
      category: 'FRM'
    });

    expect(prisma.dictionary.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        parentId: null
      })
    });
    expect(prisma.dictionary.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        parentId: null
      }),
      orderBy: [{ sortCode: 'asc' }, { name: 'asc' }],
      skip: 0,
      take: 10
    });
    expect(response.data).toEqual({
      total: 2,
      current: 1,
      size: 10,
      records: [
        expect.objectContaining({
          id: 'dict_common_status',
          dictValue: 'COMMON_STATUS',
          createdAt,
          updatedAt
        })
      ]
    });
  });

  it('returns dictionary type detail and rejects non-root nodes', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValueOnce({
      id: 'dict_common_status',
      parentId: null,
      weight: 10,
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'FRM',
      sortCode: 100,
      deleteFlag: 'NOT_DELETE',
      createTime: null,
      createUser: null,
      updateTime: null,
      updateUser: null,
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T10:00:00.000Z')
    });
    prisma.dictionary.findFirst.mockResolvedValueOnce(null);

    const response = await service.detail('dict_common_status');

    expect(response.data.id).toBe('dict_common_status');
    await expect(service.detail('dict_item_enabled')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND)
    );
  });

  it('creates root dictionary type with default label and delete flag', async () => {
    const { service, prisma, tenantScope } = createService();
    prisma.dictionary.findFirst.mockResolvedValue(null);
    prisma.dictionary.create.mockResolvedValue({
      id: 'dict_common_status',
      parentId: null,
      weight: 10,
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'FRM',
      sortCode: 100,
      deleteFlag: 'NOT_DELETE',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin',
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T10:00:00.000Z')
    });

    const response = await service.createType({
      name: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'FRM',
      weight: 10,
      sortCode: 100,
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin'
    });

    expect(prisma.dictionary.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId: null,
        tenantId: 'tenant_001',
        dictLabel: '系统通用状态',
        deleteFlag: 'NOT_DELETE'
      })
    });
    expect(tenantScope.resolveTenantValue).toHaveBeenCalled();
    expect(response.data.id).toBe('dict_common_status');
  });

  it('updates root dictionary type and keeps parentId null', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst
      .mockResolvedValueOnce({
        id: 'dict_common_status',
        parentId: null
      })
      .mockResolvedValueOnce(null);
    prisma.dictionary.update.mockResolvedValue({
      id: 'dict_common_status',
      parentId: null,
      weight: 20,
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'BIZ',
      sortCode: 200,
      deleteFlag: 'NOT_DELETE',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 11:00:00',
      updateUser: 'admin',
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T11:00:00.000Z')
    });

    const response = await service.updateType('dict_common_status', {
      name: '系统通用状态',
      category: 'BIZ',
      weight: 20,
      sortCode: 200,
      updateTime: '2026-03-22 11:00:00',
      updateUser: 'admin'
    });

    expect(prisma.dictionary.update).toHaveBeenCalledWith({
      where: { id: 'dict_common_status' },
      data: expect.objectContaining({
        parentId: null,
        dictLabel: '系统通用状态'
      })
    });
    expect(response.data.category).toBe('BIZ');
  });

  it('removes dictionary type and cascades child items', async () => {
    const { service, prisma, dictionaryItemsService } = createService();
    prisma.dictionary.findFirst.mockResolvedValue({
      id: 'dict_common_status',
      parentId: null
    });
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_common_status',
        parentId: null
      },
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status'
      },
      {
        id: 'dict_disabled',
        parentId: 'dict_common_status'
      }
    ]);
    dictionaryItemsService.collectIds.mockReturnValue([
      'dict_common_status',
      'dict_enabled',
      'dict_disabled'
    ]);

    const response = await service.removeType('dict_common_status');

    expect(dictionaryItemsService.collectIds).toHaveBeenCalledWith(
      'dict_common_status',
      expect.any(Array)
    );
    expect(prisma.dictionary.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['dict_common_status', 'dict_enabled', 'dict_disabled']
        }
      }
    });
    expect(response.data).toBe(true);
  });
});
