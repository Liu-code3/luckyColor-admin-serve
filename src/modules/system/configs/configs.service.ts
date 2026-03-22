import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infra/cache/redis/redis.service';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import {
  ConfigListQueryDto,
  CreateConfigDto,
  UpdateConfigDto
} from './configs.dto';

const CONFIG_CACHE_KEY = 'system:configs:cache';

@Injectable()
export class ConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async list(query: ConfigListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          OR: [
            { configKey: { contains: keyword } },
            { configName: { contains: keyword } }
          ]
        }
      : {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.systemConfig.count({ where }),
      this.prisma.systemConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map(item => this.toConfigResponse(item))
    });
  }

  async detail(id: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { id } });
    if (!config) {
      throw new BusinessException(BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND);
    }

    return successResponse(this.toConfigResponse(config));
  }

  async create(dto: CreateConfigDto) {
    await this.ensureConfigKeyAvailable(dto.configKey);

    try {
      const config = await this.prisma.systemConfig.create({
        data: {
          configKey: dto.configKey,
          configName: dto.configName,
          configValue: dto.configValue,
          valueType: dto.valueType ?? 'string',
          status: dto.status ?? true,
          remark: dto.remark ?? null
        }
      });

      return successResponse(this.toConfigResponse(config));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['config_key']);
    }
  }

  async update(id: string, dto: UpdateConfigDto) {
    await this.ensureConfigExists(id);

    if (dto.configKey) {
      await this.ensureConfigKeyAvailable(dto.configKey, id);
    }

    try {
      const config = await this.prisma.systemConfig.update({
        where: { id },
        data: {
          configKey: dto.configKey,
          configName: dto.configName,
          configValue: dto.configValue,
          valueType: dto.valueType,
          status: dto.status,
          remark: dto.remark
        }
      });

      return successResponse(this.toConfigResponse(config));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['config_key']);
    }
  }

  async remove(id: string) {
    await this.ensureConfigExists(id);
    await this.prisma.systemConfig.delete({ where: { id } });
    return successResponse(true);
  }

  async refreshCache() {
    const records = await this.prisma.systemConfig.findMany({
      where: { status: true },
      orderBy: { configKey: 'asc' }
    });

    const refreshedAt = new Date().toISOString();
    const snapshot = {
      refreshedAt,
      records: records.map(item => ({
        configKey: item.configKey,
        configName: item.configName,
        configValue: item.configValue,
        valueType: item.valueType,
        remark: item.remark
      })),
      recordMap: Object.fromEntries(
        records.map(item => [
          item.configKey,
          {
            configName: item.configName,
            configValue: item.configValue,
            valueType: item.valueType,
            remark: item.remark
          }
        ])
      )
    };

    const client = await this.ensureRedisClient();
    await client.set(CONFIG_CACHE_KEY, JSON.stringify(snapshot));

    return successResponse({
      cacheKey: CONFIG_CACHE_KEY,
      count: records.length,
      refreshedAt
    });
  }

  private async ensureRedisClient() {
    const client = this.redisService.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    return client;
  }

  private async ensureConfigExists(id: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { id } });
    if (!config) {
      throw new BusinessException(BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND);
    }
    return config;
  }

  private async ensureConfigKeyAvailable(configKey: string, excludeId?: string) {
    const config = await this.prisma.systemConfig.findFirst({
      where: {
        configKey,
        id: excludeId ? { not: excludeId } : undefined
      }
    });

    if (config) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private toConfigResponse(config: {
    id: string;
    configKey: string;
    configName: string;
    configValue: string;
    valueType: string;
    status: boolean;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      configKey: config.configKey,
      configName: config.configName,
      configValue: config.configValue,
      valueType: config.valueType,
      status: config.status,
      remark: config.remark,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }
}
