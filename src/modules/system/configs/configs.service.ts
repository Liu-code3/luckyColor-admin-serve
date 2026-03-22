import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ConfigListQueryDto,
  CreateConfigDto,
  UpdateConfigDto
} from './configs.dto';

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

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
      records: records.map((item) => this.toConfigResponse(item))
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

    const config = await this.prisma.systemConfig.create({
      data: {
        configKey: dto.configKey,
        configName: dto.configName,
        configValue: dto.configValue,
        valueType: dto.valueType ?? 'string',
        remark: dto.remark ?? null
      }
    });

    return successResponse(this.toConfigResponse(config));
  }

  async update(id: string, dto: UpdateConfigDto) {
    await this.ensureConfigExists(id);

    if (dto.configKey) {
      await this.ensureConfigKeyAvailable(dto.configKey, id);
    }

    const config = await this.prisma.systemConfig.update({
      where: { id },
      data: {
        configKey: dto.configKey,
        configName: dto.configName,
        configValue: dto.configValue,
        valueType: dto.valueType,
        remark: dto.remark
      }
    });

    return successResponse(this.toConfigResponse(config));
  }

  async remove(id: string) {
    await this.ensureConfigExists(id);
    await this.prisma.systemConfig.delete({ where: { id } });
    return successResponse(true);
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
      remark: config.remark,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }
}
