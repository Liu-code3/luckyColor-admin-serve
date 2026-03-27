import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type SystemConfig } from '../../../generated/prisma';
import { RedisService } from '../../../infra/cache/redis/redis.service';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { resolveSortOrder } from '../../../shared/api/list-query.util';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import {
  ConfigBatchQueryDto,
  ConfigListQueryDto,
  CreateConfigDto,
  UpdateConfigDto
} from './configs.dto';

const CONFIG_CACHE_KEY = 'system:configs:cache';

interface ConfigCacheEntry {
  configKey: string;
  configName: string;
  configValue: string;
  configGroup: string;
  valueType: string;
  isBuiltIn: boolean;
  isSensitive: boolean;
  remark: string | null;
}

interface ConfigCacheSnapshot {
  refreshedAt: string;
  records: ConfigCacheEntry[];
  recordMap: Record<string, ConfigCacheEntry>;
}

@Injectable()
export class ConfigsService {
  private readonly logger = new Logger(ConfigsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async list(query: ConfigListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const configGroup = query.configGroup?.trim();
    const filters: Prisma.SystemConfigWhereInput[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { configKey: { contains: keyword } },
          { configName: { contains: keyword } }
        ]
      });
    }

    if (configGroup) {
      filters.push({ configGroup });
    }

    if (query.status !== undefined) {
      filters.push({ status: query.status });
    }

    const where =
      filters.length === 0
        ? {}
        : filters.length === 1
          ? filters[0]
          : { AND: filters };
    const orderBy = this.buildListOrderBy(query);

    const [total, records] = await this.prisma.$transaction([
      this.prisma.systemConfig.count({ where }),
      this.prisma.systemConfig.findMany({
        where,
        orderBy,
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toConfigResponse(item))
    });
  }

  async readByKeys(query: ConfigBatchQueryDto) {
    const keys = (query.keys ?? []).map((item) => item.trim()).filter(Boolean);
    if (!keys.length) {
      return successResponse({
        records: []
      });
    }

    const snapshot = await this.getCacheSnapshot();
    const records = keys
      .map((key) => snapshot.recordMap[key])
      .filter((item): item is ConfigCacheEntry => Boolean(item))
      .map((item) => this.toConfigValueResponse(item));

    return successResponse({
      records
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
          configGroup: dto.configGroup?.trim() || 'default',
          valueType: dto.valueType ?? 'string',
          isBuiltIn: dto.isBuiltIn ?? false,
          isSensitive: dto.isSensitive ?? false,
          status: dto.status ?? true,
          remark: dto.remark ?? null
        }
      });

      await this.refreshCacheSafely();
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
          configGroup: dto.configGroup?.trim(),
          valueType: dto.valueType,
          isBuiltIn: dto.isBuiltIn,
          isSensitive: dto.isSensitive,
          status: dto.status,
          remark: dto.remark
        }
      });

      await this.refreshCacheSafely();
      return successResponse(this.toConfigResponse(config));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['config_key']);
    }
  }

  async remove(id: string) {
    await this.ensureConfigExists(id);
    await this.prisma.systemConfig.delete({ where: { id } });
    await this.refreshCacheSafely();
    return successResponse(true);
  }

  async refreshCache() {
    const snapshot = await this.buildEnabledConfigSnapshot();
    const client = await this.ensureRedisClient();
    await client.set(CONFIG_CACHE_KEY, JSON.stringify(snapshot));

    return successResponse({
      cacheKey: CONFIG_CACHE_KEY,
      count: snapshot.records.length,
      refreshedAt: snapshot.refreshedAt
    });
  }

  private async refreshCacheSafely() {
    try {
      await this.refreshCache();
    } catch (error) {
      this.logger.warn(
        `Failed to refresh config cache after mutation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getCacheSnapshot() {
    try {
      const client = await this.ensureRedisClient();
      const cached = await client.get(CONFIG_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as ConfigCacheSnapshot;
      }
    } catch (error) {
      this.logger.warn(
        `Failed to read config cache, falling back to database: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const snapshot = await this.buildEnabledConfigSnapshot();

    try {
      const client = await this.ensureRedisClient();
      await client.set(CONFIG_CACHE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      this.logger.warn(
        `Failed to rebuild config cache from database: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return snapshot;
  }

  private async buildEnabledConfigSnapshot(): Promise<ConfigCacheSnapshot> {
    const records = await this.prisma.systemConfig.findMany({
      where: { status: true },
      orderBy: [{ configGroup: 'asc' }, { configKey: 'asc' }]
    });
    const snapshotRecords = records.map((item) => this.toConfigCacheEntry(item));

    return {
      refreshedAt: new Date().toISOString(),
      records: snapshotRecords,
      recordMap: Object.fromEntries(
        snapshotRecords.map((item) => [item.configKey, item])
      )
    };
  }

  private async ensureRedisClient() {
    const client = this.redisService.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    return client;
  }

  private buildListOrderBy(
    query: ConfigListQueryDto
  ): Prisma.SystemConfigOrderByWithRelationInput[] {
    if (!query.sortBy) {
      return [{ configGroup: 'asc' }, { configKey: 'asc' }];
    }

    const sortOrder = resolveSortOrder(query.sortOrder);

    switch (query.sortBy) {
      case 'configKey':
        return [{ configKey: sortOrder }, { configGroup: 'asc' }];
      case 'configName':
        return [{ configName: sortOrder }, { configKey: 'asc' }];
      case 'status':
        return [{ status: sortOrder }, { configGroup: 'asc' }, { configKey: 'asc' }];
      case 'updatedAt':
        return [{ updatedAt: sortOrder }, { configGroup: 'asc' }, { configKey: 'asc' }];
      case 'createdAt':
        return [{ createdAt: sortOrder }, { configGroup: 'asc' }, { configKey: 'asc' }];
      case 'configGroup':
      default:
        return [{ configGroup: sortOrder }, { configKey: 'asc' }];
    }
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

  private toConfigCacheEntry(config: SystemConfig): ConfigCacheEntry {
    return {
      configKey: config.configKey,
      configName: config.configName,
      configValue: config.configValue,
      configGroup: config.configGroup,
      valueType: config.valueType,
      isBuiltIn: config.isBuiltIn,
      isSensitive: config.isSensitive,
      remark: config.remark
    };
  }

  private toConfigValueResponse(config: ConfigCacheEntry) {
    return {
      configKey: config.configKey,
      configName: config.configName,
      configValue: this.maskConfigValue(config.configValue, config.isSensitive),
      configGroup: config.configGroup,
      valueType: config.valueType,
      isBuiltIn: config.isBuiltIn,
      isSensitive: config.isSensitive,
      remark: config.remark
    };
  }

  private toConfigResponse(config: SystemConfig) {
    return {
      id: config.id,
      configKey: config.configKey,
      configName: config.configName,
      configValue: this.maskConfigValue(config.configValue, config.isSensitive),
      configGroup: config.configGroup,
      valueType: config.valueType,
      isBuiltIn: config.isBuiltIn,
      isSensitive: config.isSensitive,
      status: config.status,
      remark: config.remark,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }

  private maskConfigValue(value: string, isSensitive: boolean) {
    if (!isSensitive) {
      return value;
    }

    if (!value) {
      return '';
    }

    if (value.length <= 2) {
      return '*'.repeat(value.length);
    }

    if (value.length <= 6) {
      return `${value.slice(0, 1)}***${value.slice(-1)}`;
    }

    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }
}
