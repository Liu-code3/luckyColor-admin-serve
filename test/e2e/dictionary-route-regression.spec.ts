import 'reflect-metadata';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/modules/iam/auth/jwt-auth.guard';
import { PermissionGuard } from '../../src/modules/iam/permissions/permission-guard';
import { DictionaryModule } from '../../src/modules/system/dictionary/dictionary.module';
import { DictionaryCacheService } from '../../src/modules/system/dictionary/dictionary-cache.service';
import { DictionaryItemsService } from '../../src/modules/system/dictionary/dictionary-items.service';
import { DictionaryService } from '../../src/modules/system/dictionary/dictionary.service';
import { DictionaryTypesService } from '../../src/modules/system/dictionary/dictionary-types.service';
import { successResponse } from '../../src/shared/api/api-response';
import { AllExceptionsFilter } from '../../src/shared/filters/all-exceptions.filter';

const currentUser = {
  sub: 'user-1',
  tenantId: 'tenant_001',
  username: 'admin'
};

describe('Dictionary route regression suite', () => {
  let app: INestApplication;
  let baseUrl: string;

  const dictionaryService = {
    getTree: jest.fn().mockResolvedValue(successResponse([])),
    getPage: jest.fn().mockResolvedValue(
      successResponse({
        total: 0,
        current: 1,
        size: 10,
        records: []
      })
    ),
    getOptionsByTypeCode: jest.fn().mockResolvedValue(
      successResponse({
        typeId: 'dict_common_status',
        typeCode: 'COMMON_STATUS',
        options: [{ label: 'Enabled', value: 'ENABLE' }]
      })
    ),
    detail: jest.fn().mockResolvedValue(successResponse({ id: 'dict_common_status' })),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    refreshCache: jest.fn()
  };

  const dictionaryTypesService = {
    list: jest.fn().mockResolvedValue(
      successResponse({
        total: 1,
        current: 1,
        size: 10,
        records: [{ id: 'dict_common_status', dictValue: 'COMMON_STATUS' }]
      })
    ),
    detail: jest.fn().mockResolvedValue(
      successResponse({
        id: 'dict_common_status',
        dictValue: 'COMMON_STATUS'
      })
    ),
    createType: jest.fn(),
    updateType: jest.fn(),
    removeType: jest.fn()
  };

  const dictionaryItemsService = {
    list: jest.fn().mockResolvedValue(
      successResponse({
        total: 1,
        current: 1,
        size: 10,
        records: [{ id: 'dict_enabled', parentId: 'dict_common_status' }]
      })
    ),
    tree: jest.fn().mockResolvedValue(
      successResponse([{ id: 'dict_enabled', parentId: 'dict_common_status' }])
    ),
    detail: jest.fn().mockResolvedValue(
      successResponse({
        id: 'dict_enabled',
        parentId: 'dict_common_status'
      })
    ),
    updateStatus: jest.fn(),
    updateSort: jest.fn()
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [DictionaryModule]
    })
      .overrideProvider(DictionaryService)
      .useValue(dictionaryService)
      .overrideProvider(DictionaryTypesService)
      .useValue(dictionaryTypesService)
      .overrideProvider(DictionaryItemsService)
      .useValue(dictionaryItemsService)
      .overrideProvider(DictionaryCacheService)
      .useValue({
        getTree: jest.fn().mockResolvedValue([]),
        refreshCache: jest.fn().mockResolvedValue(true),
        refreshCacheSafely: jest.fn().mockResolvedValue(true)
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const request = context.switchToHttp().getRequest();
          request.user = currentUser;
          return true;
        }
      })
      .overrideGuard(PermissionGuard)
      .useValue({
        canActivate: () => true
      });

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve e2e server address.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes dict types list to DictionaryTypesController instead of dict detail', async () => {
    const response = await fetch(
      `${baseUrl}/api/dict/types?page=1&size=10&status=true&sortBy=sortCode&sortOrder=asc`
    );

    expect(response.status).toBe(200);
    expect(dictionaryTypesService.list).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      status: true,
      sortBy: 'sortCode',
      sortOrder: 'asc'
    });
    expect(dictionaryService.detail).not.toHaveBeenCalled();
  });

  it('routes dict items list to DictionaryItemsController instead of dict detail', async () => {
    const response = await fetch(
      `${baseUrl}/api/dict/items?typeId=dict_common_status&page=1&size=10&status=true`
    );

    expect(response.status).toBe(200);
    expect(dictionaryItemsService.list).toHaveBeenCalledWith({
      typeId: 'dict_common_status',
      page: 1,
      size: 10,
      status: true
    });
    expect(dictionaryService.detail).not.toHaveBeenCalled();
  });

  it('routes dict items tree to DictionaryItemsController tree endpoint', async () => {
    const response = await fetch(
      `${baseUrl}/api/dict/items/tree?typeId=dict_common_status&status=true`
    );

    expect(response.status).toBe(200);
    expect(dictionaryItemsService.tree).toHaveBeenCalledWith({
      typeId: 'dict_common_status',
      status: true
    });
    expect(dictionaryItemsService.detail).not.toHaveBeenCalled();
    expect(dictionaryService.detail).not.toHaveBeenCalled();
  });
});
