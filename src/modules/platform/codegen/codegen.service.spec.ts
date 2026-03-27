import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { CodegenService } from './codegen.service';

describe('CodegenService', () => {
  function createService() {
    const prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn(),
      codegenTable: {
        findMany: jest.fn(),
        findUnique: jest.fn()
      }
    };

    return {
      service: new CodegenService(prisma as never),
      prisma
    };
  }

  it('lists database tables merged with synced metadata summaries', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          tableComment: 'system users'
        },
        {
          tableName: '_prisma_migrations',
          tableComment: null
        }
      ])
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          columnName: 'id',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: 'PRI',
          extra: null,
          columnDefault: null,
          columnComment: 'user id',
          ordinalPosition: 1
        },
        {
          tableName: 'users',
          columnName: 'username',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: null,
          columnComment: 'username',
          ordinalPosition: 2
        }
      ]);
    prisma.codegenTable.findMany.mockResolvedValue([
      {
        tableName: 'users',
        tableComment: 'system users',
        moduleName: 'accounts',
        className: 'AccountUser',
        primaryKey: 'id'
      }
    ]);

    const response = await service.listTables({
      keyword: 'user'
    });

    expect(response.data.records).toEqual([
      {
        tableName: 'users',
        tableComment: 'system users',
        moduleName: 'accounts',
        className: 'AccountUser',
        primaryKey: 'id',
        columnCount: 2,
        synced: true
      }
    ]);
  });

  it('syncs inferred metadata from the database table schema', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          tableComment: 'system users'
        }
      ])
      .mockResolvedValueOnce([
        {
          columnName: 'id',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: 'PRI',
          extra: null,
          columnDefault: null,
          columnComment: 'user id',
          ordinalPosition: 1
        },
        {
          columnName: 'status',
          dataType: 'tinyint',
          columnType: 'tinyint(1)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: '1',
          columnComment: 'status',
          ordinalPosition: 2
        }
      ]);

    const tx = {
      codegenTable: {
        upsert: jest.fn().mockResolvedValue({
          id: 'cg_tbl_1',
          tableName: 'users'
        })
      },
      codegenColumn: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockResolvedValue(null)
      }
    };
    prisma.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)
    );

    const response = await service.syncTable('users');

    expect(tx.codegenTable.upsert).toHaveBeenCalled();
    expect(tx.codegenColumn.deleteMany).toHaveBeenCalledWith({
      where: {
        tableId: 'cg_tbl_1',
        columnName: {
          notIn: ['id', 'status']
        }
      }
    });
    expect(tx.codegenColumn.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        create: expect.objectContaining({
          tableId: 'cg_tbl_1',
          columnName: 'status',
          propertyName: 'status',
          tsType: 'boolean',
          formType: 'switch',
          queryType: 'eq',
          listVisible: true,
          sort: 2
        })
      })
    );
    expect(response.data.source).toBe('SYNCED');
    expect(response.data.className).toBe('User');
  });

  it('returns merged mapping detail when synced metadata exists', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          tableComment: 'system users'
        }
      ])
      .mockResolvedValueOnce([
        {
          columnName: 'username',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: null,
          columnComment: 'username',
          ordinalPosition: 1
        }
      ]);
    prisma.codegenTable.findUnique.mockResolvedValue({
      tableName: 'users',
      tableComment: 'system users',
      moduleName: 'accounts',
      businessName: 'Account Users',
      className: 'AccountUser',
      primaryKey: 'id',
      columns: [
        {
          columnName: 'username',
          propertyName: 'loginName',
          columnComment: 'login username',
          tsType: 'string',
          formType: 'input',
          queryType: 'like',
          listVisible: false,
          sort: 3
        }
      ]
    });

    const response = await service.mapping('users');

    expect(response.data).toEqual({
      tableName: 'users',
      tableComment: 'system users',
      moduleName: 'accounts',
      businessName: 'Account Users',
      className: 'AccountUser',
      primaryKey: 'id',
      source: 'SYNCED',
      columns: [
        {
          columnName: 'username',
          propertyName: 'loginName',
          columnComment: 'login username',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          nullable: false,
          primaryKey: false,
          hasDefault: false,
          autoIncrement: false,
          tsType: 'string',
          formType: 'input',
          queryType: 'like',
          listVisible: false,
          sort: 3
        }
      ]
    });
  });

  it('generates backend template files from resolved mapping metadata', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          tableComment: 'system users'
        }
      ])
      .mockResolvedValueOnce([
        {
          columnName: 'id',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: 'PRI',
          extra: null,
          columnDefault: null,
          columnComment: 'user id',
          ordinalPosition: 1
        },
        {
          columnName: 'username',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: null,
          columnComment: 'username',
          ordinalPosition: 2
        }
      ]);
    prisma.codegenTable.findUnique.mockResolvedValue({
      tableName: 'users',
      tableComment: 'system users',
      moduleName: 'users',
      businessName: 'System Users',
      className: 'User',
      primaryKey: 'id',
      columns: [
        {
          columnName: 'username',
          propertyName: 'username',
          columnComment: 'username',
          tsType: 'string',
          formType: 'input',
          queryType: 'like',
          listVisible: true,
          sort: 2
        }
      ]
    });

    const response = await service.backendTemplates('users');

    expect(response.data.files).toHaveLength(4);
    expect(response.data.files[0]).toEqual(
      expect.objectContaining({
        type: 'dto',
        path: 'src/modules/users/users.dto.ts'
      })
    );
    expect(response.data.files[0].content).toContain(
      'export class CreateUserDto'
    );
    expect(response.data.files[1].content).toContain(
      'export class UsersService'
    );
    expect(response.data.files[2].content).toContain(
      "@Controller('users')"
    );
    expect(response.data.files[3].content).toContain(
      'export class UsersModule'
    );
  });

  it('builds frontend generation metadata from resolved mapping', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          tableName: 'users',
          tableComment: 'system users'
        }
      ])
      .mockResolvedValueOnce([
        {
          columnName: 'id',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: 'PRI',
          extra: null,
          columnDefault: null,
          columnComment: 'user id',
          ordinalPosition: 1
        },
        {
          columnName: 'username',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: null,
          columnComment: 'username',
          ordinalPosition: 2
        },
        {
          columnName: 'status',
          dataType: 'tinyint',
          columnType: 'tinyint(1)',
          isNullable: 'NO',
          columnKey: null,
          extra: null,
          columnDefault: '1',
          columnComment: 'status',
          ordinalPosition: 3
        }
      ]);
    prisma.codegenTable.findUnique.mockResolvedValue({
      tableName: 'users',
      tableComment: 'system users',
      moduleName: 'users',
      businessName: 'System Users',
      className: 'User',
      primaryKey: 'id',
      columns: [
        {
          columnName: 'username',
          propertyName: 'username',
          columnComment: 'Username',
          tsType: 'string',
          formType: 'input',
          queryType: 'like',
          listVisible: true,
          sort: 2
        },
        {
          columnName: 'status',
          propertyName: 'status',
          columnComment: 'Status',
          tsType: 'boolean',
          formType: 'switch',
          queryType: 'eq',
          listVisible: true,
          sort: 3
        }
      ]
    });

    const response = await service.frontendMeta('users');

    expect(response.data).toEqual({
      tableName: 'users',
      moduleName: 'users',
      pageTitle: 'System Users',
      apiBasePath: '/api/users',
      tableColumns: [
        {
          columnName: 'username',
          field: 'username',
          label: 'Username',
          component: 'input',
          valueType: 'string',
          required: false
        },
        {
          columnName: 'status',
          field: 'status',
          label: 'Status',
          component: 'switch',
          valueType: 'boolean',
          required: false
        }
      ],
      searchFields: [
        {
          columnName: 'username',
          field: 'username',
          label: 'Username',
          queryType: 'like',
          component: 'input'
        },
        {
          columnName: 'status',
          field: 'status',
          label: 'Status',
          queryType: 'eq',
          component: 'switch'
        }
      ],
      formFields: [
        {
          columnName: 'username',
          field: 'username',
          label: 'Username',
          component: 'input',
          valueType: 'string',
          required: true
        },
        {
          columnName: 'status',
          field: 'status',
          label: 'Status',
          component: 'switch',
          valueType: 'boolean',
          required: false
        }
      ]
    });
  });

  it('throws when the target table does not exist', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.mapping('missing_table')).rejects.toEqual(
      new BusinessException(BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND)
    );
  });
});
