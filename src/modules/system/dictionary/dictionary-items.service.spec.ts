import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DictionaryItemsService } from './dictionary-items.service';

describe('DictionaryItemsService', () => {
  function createService() {
    const prisma = {
      dictionary: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      },
      $transaction: jest.fn()
    };
    const tenantScope = {
      buildWhere: jest.fn().mockImplementation((where) => where),
      resolveTenantValue: jest
        .fn()
        .mockImplementation((value?: string | null) => value ?? 'tenant_001')
    };

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return (input as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });

    return {
      service: new DictionaryItemsService(
        prisma as never,
        tenantScope as never
      ),
      prisma
    };
  }

  it('lists dictionary items under type with keyword and status filter', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValue({
      id: 'dict_common_status',
      parentId: null
    });
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status',
        weight: 10,
        name: '启用',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'ENABLE',
        category: 'FRM',
        sortCode: 10,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      },
      {
        id: 'dict_disabled',
        parentId: 'dict_common_status',
        weight: 20,
        name: '停用',
        tenantId: 'tenant_001',
        dictLabel: '停用',
        dictValue: 'DISABLED',
        category: 'FRM',
        sortCode: 20,
        status: false,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      }
    ]);

    const response = await service.list({
      typeId: 'dict_common_status',
      page: 1,
      size: 10,
      keyword: '启',
      status: true
    });

    expect(response.data.total).toBe(1);
    expect(response.data.records).toEqual([
      expect.objectContaining({
        id: 'dict_enabled',
        status: true
      })
    ]);
  });

  it('returns dictionary item tree under type', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValue({
      id: 'dict_common_status',
      parentId: null
    });
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status',
        weight: 10,
        name: '启用',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'ENABLE',
        category: 'FRM',
        sortCode: 10,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      },
      {
        id: 'dict_enabled_child',
        parentId: 'dict_enabled',
        weight: 20,
        name: '启用子项',
        tenantId: 'tenant_001',
        dictLabel: '启用子项',
        dictValue: 'ENABLE_CHILD',
        category: 'FRM',
        sortCode: 20,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      }
    ]);

    const response = await service.tree({
      typeId: 'dict_common_status'
    });

    expect(response.data).toEqual([
      expect.objectContaining({
        id: 'dict_enabled',
        children: [expect.objectContaining({ id: 'dict_enabled_child' })]
      })
    ]);
  });

  it('cascades descendant items when disabling status', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValue({
      id: 'dict_enabled',
      parentId: 'dict_common_status'
    });
    prisma.dictionary.findMany.mockResolvedValue([
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status',
        weight: 10,
        name: '启用',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'ENABLE',
        category: 'FRM',
        sortCode: 10,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      },
      {
        id: 'dict_enabled_child',
        parentId: 'dict_enabled',
        weight: 20,
        name: '启用子项',
        tenantId: 'tenant_001',
        dictLabel: '启用子项',
        dictValue: 'ENABLE_CHILD',
        category: 'FRM',
        sortCode: 20,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: null,
        createUser: null,
        updateTime: null,
        updateUser: null,
        createdAt: new Date('2026-03-22T10:00:00.000Z'),
        updatedAt: new Date('2026-03-22T10:00:00.000Z')
      }
    ]);
    prisma.dictionary.update.mockResolvedValue({
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 10,
      status: false,
      deleteFlag: 'NOT_DELETE',
      createTime: null,
      createUser: null,
      updateTime: null,
      updateUser: null,
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T11:00:00.000Z')
    });

    const response = await service.updateStatus('dict_enabled', {
      status: false
    });

    expect(prisma.dictionary.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['dict_enabled_child']
        }
      },
      data: {
        status: false
      }
    });
    expect(response.data.status).toBe(false);
  });

  it('updates dictionary item sortCode independently', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValue({
      id: 'dict_enabled',
      parentId: 'dict_common_status'
    });
    prisma.dictionary.update.mockResolvedValue({
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 200,
      status: true,
      deleteFlag: 'NOT_DELETE',
      createTime: null,
      createUser: null,
      updateTime: null,
      updateUser: null,
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T11:00:00.000Z')
    });

    const response = await service.updateSort('dict_enabled', {
      sortCode: 200
    });

    expect(prisma.dictionary.update).toHaveBeenCalledWith({
      where: { id: 'dict_enabled' },
      data: {
        sortCode: 200
      }
    });
    expect(response.data.sortCode).toBe(200);
  });

  it('rejects missing dictionary type when listing items', async () => {
    const { service, prisma } = createService();
    prisma.dictionary.findFirst.mockResolvedValue(null);

    await expect(
      service.list({
        typeId: 'dict_missing',
        page: 1,
        size: 10
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND)
    );
  });
});
