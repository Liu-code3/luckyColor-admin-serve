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
  type DictionaryItemListQueryDto,
  type DictionaryItemSortDto,
  type DictionaryItemTreeQueryDto,
  type UpdateDictionaryItemStatusDto
} from './dictionary-items.dto';
import type { DictionaryItemNode } from './dictionary.models';

@Injectable()
export class DictionaryItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
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

  async list(query: DictionaryItemListQueryDto) {
    await this.ensureTypeExists(query.typeId);

    const rows = await this.findMany();
    const scopedRows = this.filterRowsByType(
      query.typeId,
      rows,
      query.status,
      query.keyword
    );
    const current = query.page || 1;
    const size = query.size || 10;
    const records = scopedRows.slice((current - 1) * size, current * size);

    return successResponse({
      total: scopedRows.length,
      current,
      size,
      records: records.map((item) => this.toItemResponse(item))
    });
  }

  async tree(query: DictionaryItemTreeQueryDto) {
    await this.ensureTypeExists(query.typeId);

    const rows = await this.findMany();
    const scopedRows = this.filterRowsByType(query.typeId, rows, query.status);
    const itemForest = this.buildForest(scopedRows);

    return successResponse(itemForest.get(query.typeId) ?? []);
  }

  async detail(id: string) {
    const item = await this.findFirst({ id });
    if (!item) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return successResponse(this.toItemResponse(item));
  }

  async updateStatus(id: string, dto: UpdateDictionaryItemStatusDto) {
    await this.ensureItemExists(id);

    const updated = await this.prisma.$transaction(
      async (tx) => {
        if (dto.status === false) {
          const rows = await tx.dictionary.findMany({
            where: this.buildWhere()
          });
          const ids = this.collectIds(
            id,
            rows.map((item) => this.toNode(item))
          ).filter((itemId) => itemId !== id);

          if (ids.length) {
            await tx.dictionary.updateMany({
              where: {
                id: {
                  in: ids
                }
              },
              data: {
                status: false
              }
            });
          }
        }

        return tx.dictionary.update({
          where: { id },
          data: {
            status: dto.status
          }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return successResponse(this.toItemResponse(updated));
  }

  async updateSort(id: string, dto: DictionaryItemSortDto) {
    await this.ensureItemExists(id);

    const updated = await this.prisma.dictionary.update({
      where: { id },
      data: {
        sortCode: dto.sortCode
      }
    });

    return successResponse(this.toItemResponse(updated));
  }

  create(dto: CreateDictionaryDto) {
    return this.prisma.dictionary.create({
      data: {
        id: createDictionaryId(dto.id),
        parentId: dto.parentId && dto.parentId !== '0' ? dto.parentId : null,
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
  }

  update(id: string, dto: UpdateDictionaryDto) {
    return this.prisma.dictionary.update({
      where: { id },
      data: {
        parentId:
          dto.parentId === undefined
            ? undefined
            : dto.parentId && dto.parentId !== '0'
              ? dto.parentId
              : null,
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
  }

  toNode(row: Dictionary): DictionaryItemNode {
    const {
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      parentId,
      ...rest
    } = row;
    return {
      ...rest,
      parentId: parentId ?? '0'
    };
  }

  buildForest(rows: Dictionary[]) {
    const nodes = rows.map((row) => this.toNode(row));
    const nodeMap = new Map<string, DictionaryItemNode>();
    const rootsByParent = new Map<string, DictionaryItemNode[]>();

    nodes.forEach((item) => {
      nodeMap.set(item.id, {
        ...item,
        children: []
      });
    });

    nodeMap.forEach((item) => {
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
        return;
      }

      const roots = rootsByParent.get(item.parentId) || [];
      roots.push(item);
      rootsByParent.set(item.parentId, roots);
    });

    rootsByParent.forEach((roots, parentId) => {
      rootsByParent.set(
        parentId,
        roots.map((item) => this.pruneEmptyChildren(item))
      );
    });

    return rootsByParent;
  }

  collectIds(rootId: string, rows: DictionaryItemNode[]) {
    const ids = [rootId];
    const visited = new Set(ids);
    const walk = (parentId: string) => {
      rows
        .filter((item) => item.parentId === parentId)
        .forEach((item) => {
          if (visited.has(item.id)) {
            return;
          }

          visited.add(item.id);
          ids.push(item.id);
          walk(item.id);
        });
    };

    walk(rootId);
    return ids;
  }

  private async ensureTypeExists(typeId: string) {
    const type = await this.prisma.dictionary.findFirst({
      where: this.tenantScope.buildWhere(
        {
          id: typeId,
          parentId: null
        },
        'tenantId',
        {
          includeGlobal: true
        }
      ) as Prisma.DictionaryWhereInput
    });

    if (!type) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return type;
  }

  private async ensureItemExists(id: string) {
    const item = await this.findFirst({ id });
    if (!item) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return item;
  }

  private filterRowsByType(
    typeId: string,
    rows: Dictionary[],
    status?: boolean,
    keyword?: string
  ) {
    const itemNodes = rows.map((item) => this.toNode(item));
    const ids = new Set(
      this.collectIds(typeId, itemNodes).filter((itemId) => itemId !== typeId)
    );
    const normalizedKeyword = keyword?.trim();

    return rows
      .filter((item) => ids.has(item.id))
      .filter((item) => status === undefined || item.status === status)
      .filter((item) => {
        if (!normalizedKeyword) {
          return true;
        }

        return (
          item.name.includes(normalizedKeyword) ||
          item.dictLabel.includes(normalizedKeyword) ||
          item.dictValue.includes(normalizedKeyword)
        );
      })
      .sort((left, right) => {
        if (left.sortCode === right.sortCode) {
          return left.name.localeCompare(right.name, 'zh-CN');
        }

        return left.sortCode - right.sortCode;
      });
  }

  private toItemResponse(row: Dictionary) {
    return {
      id: row.id,
      parentId: row.parentId ?? '0',
      weight: row.weight,
      name: row.name,
      tenantId: row.tenantId,
      dictLabel: row.dictLabel,
      dictValue: row.dictValue,
      category: row.category,
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

  private pruneEmptyChildren(node: DictionaryItemNode): DictionaryItemNode {
    const children = (node.children || []).map((child) =>
      this.pruneEmptyChildren(child)
    );
    if (!children.length) {
      const { children: _children, ...rest } = node;
      return rest;
    }

    return {
      ...node,
      children
    };
  }

  private buildWhere(where: Prisma.DictionaryWhereInput = {}) {
    return this.tenantScope.buildWhere(
      {
        ...where,
        parentId: {
          not: null
        }
      },
      'tenantId',
      {
        includeGlobal: true
      }
    ) as Prisma.DictionaryWhereInput;
  }
}
