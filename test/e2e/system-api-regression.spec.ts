import 'reflect-metadata';
import { HttpStatus, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/modules/iam/auth/jwt-auth.guard';
import { PermissionGuard } from '../../src/modules/iam/permissions/permission-guard';
import { UsersController } from '../../src/modules/system/users/users.controller';
import { UsersService } from '../../src/modules/system/users/users.service';
import { RolesController } from '../../src/modules/system/roles/roles.controller';
import { RolesService } from '../../src/modules/system/roles/roles.service';
import { MenusController } from '../../src/modules/system/menus/menus.controller';
import { MenusService } from '../../src/modules/system/menus/menus.service';
import { DepartmentsController } from '../../src/modules/system/departments/departments.controller';
import { DepartmentsService } from '../../src/modules/system/departments/departments.service';
import { DictionaryController } from '../../src/modules/system/dictionary/dictionary.controller';
import { DictionaryService } from '../../src/modules/system/dictionary/dictionary.service';
import { ConfigsController } from '../../src/modules/system/configs/configs.controller';
import { ConfigsService } from '../../src/modules/system/configs/configs.service';
import { NoticesController } from '../../src/modules/system/notices/notices.controller';
import { NoticesService } from '../../src/modules/system/notices/notices.service';
import { successResponse } from '../../src/shared/api/api-response';
import { AllExceptionsFilter } from '../../src/shared/filters/all-exceptions.filter';

const currentUser = {
  sub: 'user-1',
  tenantId: 'tenant_001',
  username: 'admin'
};

function createSystemServices() {
  return {
    usersService: {
      list: jest.fn().mockResolvedValue(
        successResponse({
          total: 1,
          current: 1,
          size: 5,
          records: [{ id: 'user-1', username: 'admin' }]
        })
      )
    },
    rolesService: {
      list: jest.fn().mockResolvedValue(
        successResponse({
          total: 1,
          current: 2,
          size: 20,
          records: [{ id: 'role-1', code: 'tenant_admin' }]
        })
      )
    },
    menusService: {
      list: jest.fn().mockResolvedValue(
        successResponse({
          total: 1,
          current: 1,
          size: 10,
          records: [{ id: 1, title: 'System' }]
        })
      ),
      tree: jest.fn().mockResolvedValue(
        successResponse([{ id: 1, title: 'System', children: [] }])
      )
    },
    departmentsService: {
      descendantIds: jest.fn().mockResolvedValue(
        successResponse({
          departmentId: 100,
          departmentIds: [100, 110, 120]
        })
      )
    },
    dictionaryService: {
      getOptionsByTypeCode: jest.fn().mockResolvedValue(
        successResponse({
          typeId: 'dict_common_status',
          typeLabel: 'Common Status',
          typeCode: 'COMMON_STATUS',
          category: 'system_status',
          options: [{ label: 'Enabled', value: 'ENABLE' }]
        })
      )
    },
    configsService: {
      readByKeys: jest.fn().mockResolvedValue(
        successResponse({
          records: [
            { configKey: 'sys.default_locale', configValue: 'zh-CN' },
            { configKey: 'sys.enable_watermark', configValue: 'true' }
          ]
        })
      )
    },
    noticesService: {
      create: jest.fn().mockImplementation((dto) =>
        Promise.resolve(
          successResponse({
            id: 'notice-1',
            ...dto
          })
        )
      )
    }
  };
}

describe('System API regression suite', () => {
  let app: INestApplication;
  let baseUrl: string;
  let services: ReturnType<typeof createSystemServices>;

  beforeAll(async () => {
    services = createSystemServices();

    @Module({
      controllers: [
        UsersController,
        RolesController,
        MenusController,
        DepartmentsController,
        DictionaryController,
        ConfigsController,
        NoticesController
      ],
      providers: [
        { provide: UsersService, useValue: services.usersService },
        { provide: RolesService, useValue: services.rolesService },
        { provide: MenusService, useValue: services.menusService },
        { provide: DepartmentsService, useValue: services.departmentsService },
        { provide: DictionaryService, useValue: services.dictionaryService },
        { provide: ConfigsService, useValue: services.configsService },
        { provide: NoticesService, useValue: services.noticesService }
      ]
    })
    class SystemApiRegressionModule {}

    const moduleBuilder = Test.createTestingModule({
      imports: [SystemApiRegressionModule]
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

  it('regresses user list endpoint with current-user injection and query transforms', async () => {
    services.usersService.list.mockResolvedValueOnce(
      successResponse({
        total: 1,
        current: 1,
        size: 5,
        records: [{ id: 'user-1', username: 'admin' }]
      })
    );

    const response = await fetch(
      `${baseUrl}/api/users?page=1&size=5&status=true&departmentId=100&sortBy=createdAt&sortOrder=desc`
    );

    expect(response.status).toBe(200);
    expect(services.usersService.list).toHaveBeenCalledWith(currentUser, {
      page: 1,
      size: 5,
      status: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      departmentId: 100
    });
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        total: 1,
        current: 1,
        size: 5,
        records: [{ id: 'user-1', username: 'admin' }]
      }
    });
  });

  it('regresses role list endpoint query parsing', async () => {
    const response = await fetch(
      `${baseUrl}/api/roles?page=2&size=20&status=false&sortBy=sort&sortOrder=asc`
    );

    expect(response.status).toBe(200);
    expect(services.rolesService.list).toHaveBeenCalledWith({
      page: 2,
      size: 20,
      status: false,
      sortBy: 'sort',
      sortOrder: 'asc'
    });
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        total: 1,
        current: 2,
        size: 20,
        records: [{ id: 'role-1', code: 'tenant_admin' }]
      }
    });
  });

  it('regresses menu tree endpoint with current-user injection', async () => {
    const response = await fetch(
      `${baseUrl}/api/menus/tree?view=tenant&roleId=role-1`
    );

    expect(response.status).toBe(200);
    expect(services.menusService.tree).toHaveBeenCalledWith(currentUser, {
      view: 'tenant',
      roleId: 'role-1'
    });
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: [{ id: 1, title: 'System', children: [] }]
    });
  });

  it('regresses menu list endpoint keyword and sorting params', async () => {
    const response = await fetch(
      `${baseUrl}/api/menus?page=1&size=10&keyword=system&status=true&sortBy=sort&sortOrder=asc`
    );

    expect(response.status).toBe(200);
    expect(services.menusService.list).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: 'system',
      status: true,
      sortBy: 'sort',
      sortOrder: 'asc'
    });
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        total: 1,
        current: 1,
        size: 10,
        records: [{ id: 1, title: 'System' }]
      }
    });
  });

  it('regresses department descendant-ids route param parsing', async () => {
    const response = await fetch(`${baseUrl}/api/departments/100/descendant-ids`);

    expect(response.status).toBe(200);
    expect(services.departmentsService.descendantIds).toHaveBeenCalledWith(100);
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        departmentId: 100,
        departmentIds: [100, 110, 120]
      }
    });
  });

  it('regresses dictionary options endpoint path binding', async () => {
    const response = await fetch(`${baseUrl}/api/dict/options/COMMON_STATUS`);

    expect(response.status).toBe(200);
    expect(services.dictionaryService.getOptionsByTypeCode).toHaveBeenCalledWith(
      'COMMON_STATUS'
    );
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        typeId: 'dict_common_status',
        typeLabel: 'Common Status',
        typeCode: 'COMMON_STATUS',
        category: 'system_status',
        options: [{ label: 'Enabled', value: 'ENABLE' }]
      }
    });
  });

  it('regresses config batch-read query array transform', async () => {
    const response = await fetch(
      `${baseUrl}/api/configs/batch-read?keys=sys.default_locale,sys.enable_watermark`
    );

    expect(response.status).toBe(200);
    expect(services.configsService.readByKeys).toHaveBeenCalledWith({
      keys: ['sys.default_locale', 'sys.enable_watermark']
    });
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        records: [
          { configKey: 'sys.default_locale', configValue: 'zh-CN' },
          { configKey: 'sys.enable_watermark', configValue: 'true' }
        ]
      }
    });
  });

  it('regresses notice create endpoint body binding', async () => {
    const payload = {
      title: 'Release Update Reminder',
      content: 'Review role permissions before the new release arrives.',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: [100, 120],
      targetRoleCodes: ['tenant_admin'],
      isPinned: true,
      publisher: 'Product Team',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' }
    };

    const response = await fetch(`${baseUrl}/api/notices`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    expect(services.noticesService.create).toHaveBeenCalledWith(payload);
    await expect(response.json()).resolves.toEqual({
      code: 200,
      msg: 'success',
      data: {
        id: 'notice-1',
        ...payload
      }
    });
  });

  it('returns unified validation errors for invalid query params', async () => {
    const response = await fetch(`${baseUrl}/api/users?page=0`);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: 1016001,
      msg: '请求参数校验失败',
      data: null
    });
    expect(services.usersService.list).not.toHaveBeenCalled();
  });

  it('returns unified validation errors for invalid sort order params', async () => {
    const response = await fetch(`${baseUrl}/api/users?sortOrder=sideways`);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: 1016001,
      msg: '请求参数校验失败',
      data: null
    });
    expect(services.usersService.list).not.toHaveBeenCalled();
  });

  it('returns unified validation errors for invalid notice payloads', async () => {
    const response = await fetch(`${baseUrl}/api/notices`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        content: 'missing title',
        type: 'release'
      })
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: 1016001,
      msg: '请求参数校验失败',
      data: null
    });
    expect(services.noticesService.create).not.toHaveBeenCalled();
  });
});
