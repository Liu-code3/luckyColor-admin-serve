import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { ConfigsService } from './configs.service';

describe('ConfigsService', () => {
  function createPrismaMock() {
    return {
      systemConfig: {
        findFirst: jest.fn(),
        create: jest.fn()
      }
    };
  }

  const createRedisServiceMock = () => ({
    getClient: jest.fn()
  });

  const createUniqueConstraintError = (target: string[]) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target }
    });

  it('translates duplicate config keys into business errors', async () => {
    const prisma = createPrismaMock();
    const service = new ConfigsService(
      prisma as never,
      createRedisServiceMock() as never
    );

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
});
