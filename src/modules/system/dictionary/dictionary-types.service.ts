import { Injectable } from '@nestjs/common';
import { Prisma, type Dictionary } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  createDictionaryId,
  type CreateDictionaryDto,
  type UpdateDictionaryDto
} from './dictionary.dto';
import {
  type CreateDictionaryTypeDto,
  type DictionaryTypeListQueryDto,
  type UpdateDictionaryTypeDto
} from './dictionary-types.dto';
import { DictionaryCacheService } from './dictionary-cache.service';
import type { DictionaryTypeNode } from './dictionary.models';
import { DictionaryItemsService } from './dictionary-items.service';

@Injectable()
export class DictionaryTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly dictionaryCacheService: DictionaryCacheService,
    private readonly dictionaryItemsService: DictionaryItemsService
  ) {}

  findMany() {
    return this.prisma.dictionary.findMany({
      where: this.buildWhere(),
      orderBy: [{ sortCode: 'asc' }, { name: 'asc' }]
    });
  }

  findFirst(where: Prisma.DictionaryWhereInput) {
    return this.prisma.dictionary.findFirst({
      where: this.buildWhere(where)
    });
  }

  async list(query: DictionaryTypeListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const category = query.category?.trim();
    const filters: Prisma.DictionaryWhereInput[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { name: { contains: keyword } },
          { dictLabel: { contains: keyword } },
          { dictValue: { contains: keyword } }
        ]
      });
    }

    if (category) {
      filters.push({ category });
    }

    const where =
      filters.length === 0
        ? this.buildWhere()
        : this.buildWhere(
            filters.length === 1 ? filters[0] : { AND: filters }
          );

    const [total, records] = await this.prisma.$transaction([
      this.prisma.dictionary.count({ where }),
      this.prisma.dictionary.findMany({
        where,
        orderBy: [{ sortCode: 'asc' }, { name: 'asc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toTypeResponse(item))
    });
  }

  async detail(id: string) {
    const record = await this.findFirst({ id });
    if (!record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return successResponse(this.toTypeResponse(record));
  }

  async createType(dto: CreateDictionaryTypeDto) {
    await this.ensureTypeCodeAvailable(dto.dictValue);
    const record = await this.create(this.toCreateDto(dto));
    return successResponse(this.toTypeResponse(record));
  }

  async updateType(id: string, dto: UpdateDictionaryTypeDto) {
    const record = await this.findFirst({ id });
    if (!record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    if (dto.dictValue) {
      await this.ensureTypeCodeAvailable(dto.dictValue, id);
    }

    const updated = await this.update(id, this.toUpdateDto(dto));
    return successResponse(this.toTypeResponse(updated));
  }

  async removeType(id: string) {
    const record = await this.findFirst({ id });
    if (!record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    await this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.dictionary.findMany({
          where: this.buildTenantWhere()
        });
        const itemNodes = rows
          .filter((item) => item.parentId !== null)
          .map((item) => this.dictionaryItemsService.toNode(item));
        const ids = this.dictionaryItemsService
          .collectIds(id, itemNodes)
          .filter((itemId, index, arr) => arr.indexOf(itemId) === index);

        await tx.dictionary.deleteMany({
          where: {
            id: {
              in: ids
            }
          }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    await this.dictionaryCacheService.refreshCacheSafely();
    return successResponse(true);
  }

  async create(dto: CreateDictionaryDto) {
    const created = await this.prisma.dictionary.create({
      data: {
        id: createDictionaryId(dto.id),
        parentId: null,
        weight: dto.weight,
        name: dto.name,
        tenantId: this.tenantScope.resolveTenantValue(dto.tenantId),
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        category: dto.category,
        sortCode: dto.sortCode,
        status: dto.status ?? true,
        deleteFlag: dto.deleteFlag,
        createTime: dto.createTime ?? null,
        createUser: dto.createUser ?? null,
        updateTime: dto.updateTime ?? null,
        updateUser: dto.updateUser ?? null
      }
    });

    await this.dictionaryCacheService.refreshCacheSafely();
    return created;
  }

  async update(id: string, dto: UpdateDictionaryDto) {
    const updated = await this.prisma.dictionary.update({
      where: { id },
      data: {
        parentId:
          dto.parentId === undefined || dto.parentId === '0'
            ? null
            : dto.parentId,
        weight: dto.weight,
        name: dto.name,
        tenantId: this.tenantScope.resolveTenantValue(dto.tenantId),
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        category: dto.category,
        sortCode: dto.sortCode,
        status: dto.status,
        deleteFlag: dto.deleteFlag,
        createTime: dto.createTime,
        createUser: dto.createUser,
        updateTime: dto.updateTime,
        updateUser: dto.updateUser
      }
    });

    await this.dictionaryCacheService.refreshCacheSafely();
    return updated;
  }

  toNode(row: Dictionary): DictionaryTypeNode {
    const { parentId: _parentId, ...rest } = row;

    return {
      ...rest,
      parentId: '0'
    };
  }

  private async ensureTypeCodeAvailable(dictValue: string, excludeId?: string) {
    const record = await this.findFirst({
      dictValue,
      id: excludeId ? { not: excludeId } : undefined
    });

    if (record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private toCreateDto(dto: CreateDictionaryTypeDto): CreateDictionaryDto {
    return {
      id: dto.id,
      weight: dto.weight,
      name: dto.name,
      tenantId: dto.tenantId,
      dictLabel: dto.dictLabel?.trim() || dto.name,
      dictValue: dto.dictValue,
      category: dto.category,
      sortCode: dto.sortCode,
      status: dto.status,
      deleteFlag: dto.deleteFlag ?? 'NOT_DELETE',
      createTime: dto.createTime,
      createUser: dto.createUser,
      updateTime: dto.updateTime,
      updateUser: dto.updateUser
    };
  }

  private toUpdateDto(dto: UpdateDictionaryTypeDto): UpdateDictionaryDto {
    return {
      weight: dto.weight,
      name: dto.name,
      tenantId: dto.tenantId,
      dictLabel: dto.dictLabel ?? dto.name,
      dictValue: dto.dictValue,
      category: dto.category,
      sortCode: dto.sortCode,
      status: dto.status,
      deleteFlag: dto.deleteFlag,
      createTime: dto.createTime,
      createUser: dto.createUser,
      updateTime: dto.updateTime,
      updateUser: dto.updateUser
    };
  }

  private toTypeResponse(row: Dictionary) {
    return {
      id: row.id,
      name: row.name,
      tenantId: row.tenantId,
      dictLabel: row.dictLabel,
      dictValue: row.dictValue,
      category: row.category,
      weight: row.weight,
      sortCode: row.sortCode,
      status: row.status,
      deleteFlag: row.deleteFlag,
      createTime: row.createTime,
      createUser: row.createUser,
      updateTime: row.updateTime,
      updateUser: row.updateUser,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private buildTenantWhere(where: Prisma.DictionaryWhereInput = {}) {
    return this.tenantScope.buildWhere(where, 'tenantId', {
      includeGlobal: true
    }) as Prisma.DictionaryWhereInput;
  }

  private buildWhere(where: Prisma.DictionaryWhereInput = {}) {
    return this.buildTenantWhere({
      ...where,
      parentId: null
    });
  }
}
