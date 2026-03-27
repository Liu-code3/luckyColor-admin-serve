import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { ConfigsService } from './configs.service';

describe('ConfigsService', () => {
  function createService() {
    const prisma = {
      systemConfig: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      $transaction: jest.fn()
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

    prisma.$transaction.mockImplementation(async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return input;
    });

    return {
      service: new ConfigsService(prisma as never, redisService as never),
      prisma,
      redisClient
    };
  }

  function createConfig(overrides: Record<string, unknown> = {}) {
    return {
      id: 'cfg_1',
      configKey: 'sys.default_locale',
      configName: 'Default Locale',
      configValue: 'zh-CN',
      configGroup: 'appearance',
      valueType: 'string',
      isBuiltIn: true,
      isSensitive: false,
      status: true,
      remark: 'default locale',
      createdAt: new Date('2026-03-25T06:00:00.000Z'),
      updatedAt: new Date('2026-03-25T06:00:00.000Z'),
      ...overrides
    };
  }

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('lists configs with filters and masks sensitive values', async () => {
    const { service, prisma } = createService();
    prisma.systemConfig.count.mockResolvedValue(1);
    prisma.systemConfig.findMany.mockResolvedValue([
      createConfig({
        configKey: 'sys.login.captcha_secret',
        configName: 'Captcha Secret',
        configValue: 'captcha-secret-demo',
        configGroup: 'login',
        isSensitive: true
      })
    ]);

    const response = await service.list({
      page: 1,
      size: 10,
      keyword: 'captcha',
      configGroup: 'login',
      status: true
    });

    expect(prisma.systemConfig.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            OR: [
              { configKey: { contains: 'captcha' } },
              { configName: { contains: 'captcha' } }
            ]
          },
          { configGroup: 'login' },
          { status: true }
        ]
      }
    });
    expect(response.data.records).toEqual([
      expect.objectContaining({
        configKey: 'sys.login.captcha_secret',
        configValue: 'ca***mo',
        configGroup: 'login',
        isSensitive: true
      })
    ]);
  });

  it('reads config detail and masks sensitive values', async () => {
    const { service, prisma } = createService();
    prisma.systemConfig.findUnique.mockResolvedValue(
      createConfig({
        configKey: 'sys.login.captcha_secret',
        configValue: 'captcha-secret-demo',
        configGroup: 'login',
        isSensitive: true
      })
    );

    const response = await service.detail('cfg_1');

    expect(response.data).toEqual(
      expect.objectContaining({
        configKey: 'sys.login.captcha_secret',
        configValue: 'ca***mo',
        isSensitive: true
      })
    );
  });

  it('creates configs with group and sensitivity fields then refreshes cache', async () => {
    const { service, prisma, redisClient } = createService();
    prisma.systemConfig.findFirst.mockResolvedValue(null);
    prisma.systemConfig.create.mockResolvedValue(
      createConfig({
        configKey: 'sys.login.captcha_secret',
        configValue: 'captcha-secret-demo',
        configGroup: 'login',
        isSensitive: true,
        isBuiltIn: false
      })
    );
    prisma.systemConfig.findMany.mockResolvedValue([
      createConfig({
        configKey: 'sys.default_locale'
      })
    ]);

    const response = await service.create({
      configKey: 'sys.login.captcha_secret',
      configName: 'Captcha Secret',
      configValue: 'captcha-secret-demo',
      configGroup: 'login',
      valueType: 'string',
      isBuiltIn: false,
      isSensitive: true,
      status: true,
      remark: 'used by login page'
    });

    expect(prisma.systemConfig.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        configKey: 'sys.login.captcha_secret',
        configGroup: 'login',
        isBuiltIn: false,
        isSensitive: true
      })
    });
    expect(redisClient.set).toHaveBeenCalled();
    expect(response.data).toEqual(
      expect.objectContaining({
        configValue: 'ca***mo',
        configGroup: 'login',
        isSensitive: true
      })
    );
  });

  it('reads config values by keys from cache and preserves query order', async () => {
    const { service, redisClient, prisma } = createService();
    redisClient.get.mockResolvedValue(
      JSON.stringify({
        refreshedAt: '2026-03-25T06:00:00.000Z',
        records: [],
        recordMap: {
          'sys.enable_watermark': {
            configKey: 'sys.enable_watermark',
            configName: 'Enable Watermark',
            configValue: 'true',
            configGroup: 'appearance',
            valueType: 'boolean',
            isBuiltIn: true,
            isSensitive: false,
            remark: null
          },
          'sys.login.captcha_secret': {
            configKey: 'sys.login.captcha_secret',
            configName: 'Captcha Secret',
            configValue: 'captcha-secret-demo',
            configGroup: 'login',
            valueType: 'string',
            isBuiltIn: true,
            isSensitive: true,
            remark: null
          }
        }
      })
    );

    const response = await service.readByKeys({
      keys: ['sys.login.captcha_secret', 'sys.enable_watermark', 'missing']
    });

    expect(prisma.systemConfig.findMany).not.toHaveBeenCalled();
    expect(response.data.records).toEqual([
      {
        configKey: 'sys.login.captcha_secret',
        configName: 'Captcha Secret',
        configValue: 'ca***mo',
        configGroup: 'login',
        valueType: 'string',
        isBuiltIn: true,
        isSensitive: true,
        remark: null
      },
      {
        configKey: 'sys.enable_watermark',
        configName: 'Enable Watermark',
        configValue: 'true',
        configGroup: 'appearance',
        valueType: 'boolean',
        isBuiltIn: true,
        isSensitive: false,
        remark: null
      }
    ]);
  });

  it('refreshes cache with enabled configs only', async () => {
    const { service, prisma, redisClient } = createService();
    prisma.systemConfig.findMany.mockResolvedValue([
      createConfig({
        configKey: 'sys.default_locale',
        configGroup: 'appearance',
        isSensitive: false
      }),
      createConfig({
        id: 'cfg_2',
        configKey: 'sys.enable_watermark',
        configName: 'Enable Watermark',
        configValue: 'true',
        configGroup: 'appearance',
        valueType: 'boolean'
      })
    ]);

    const response = await service.refreshCache();

    expect(prisma.systemConfig.findMany).toHaveBeenCalledWith({
      where: { status: true },
      orderBy: [{ configGroup: 'asc' }, { configKey: 'asc' }]
    });
    expect(redisClient.set).toHaveBeenCalledWith(
      'system:configs:cache',
      expect.stringContaining('"sys.default_locale"')
    );
    expect(response.data).toEqual(
      expect.objectContaining({
        cacheKey: 'system:configs:cache',
        count: 2
      })
    );
  });

  it('translates duplicate config keys into business errors', async () => {
    const { service, prisma } = createService();
    prisma.systemConfig.findFirst.mockResolvedValue(null);
    prisma.systemConfig.create.mockRejectedValue(
      createUniqueConstraintError(['config_key'])
    );

    await expect(
      service.create({
        configKey: 'sys.default_locale',
        configName: 'Default Locale',
        configValue: 'zh-CN'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });

  it('throws when config detail does not exist', async () => {
    const { service, prisma } = createService();
    prisma.systemConfig.findUnique.mockResolvedValue(null);

    await expect(service.detail('missing')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND)
    );
  });
});
