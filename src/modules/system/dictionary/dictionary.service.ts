import { Injectable } from '@nestjs/common';
import { Prisma, type Dictionary } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  CreateDictionaryDto,
  DictionaryPageQueryDto,
  UpdateDictionaryDto
} from './dictionary.dto';
import { DictionaryCacheService } from './dictionary-cache.service';
import type {
  DictionaryNode,
  DictionaryOptionItem
} from './dictionary.models';
import { DictionaryItemsService } from './dictionary-items.service';
import { DictionaryTypesService } from './dictionary-types.service';

@Injectable()
export class DictionaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly dictionaryCacheService: DictionaryCacheService,
    private readonly dictionaryTypesService: DictionaryTypesService,
    private readonly dictionaryItemsService: DictionaryItemsService
  ) {}

  async getTree() {
    const tree = await this.dictionaryCacheService.getTree();
    return successResponse(tree);
  }

  async getOptionsByTypeCode(dictValue: string) {
    const typeCode = dictValue.trim();
    const tree = await this.dictionaryCacheService.getTree();
    const typeNode = this.getMergedTypeNode(typeCode, tree);

    if (!typeNode.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return successResponse({
      typeId: typeNode.id,
      typeLabel: typeNode.dictLabel,
      typeCode: typeNode.dictValue,
      category: typeNode.category,
      options: this.toOptionItems(typeNode.children || [])
    });
  }

  async getPage(query: DictionaryPageQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const id = query.id?.trim() || '';
    const searchKey = query.searchKey?.trim() || '';
    const tree = await this.dictionaryCacheService.getTree();

    let recordsAll = this.sortByCode(this.treeToData(tree));

    if (!id && searchKey) {
      recordsAll = this.filterDataByKey(searchKey, tree);
    }

    if (id && !searchKey) {
      recordsAll = this.getFlattenedRecordsById(id, tree);
    }

    if (id && searchKey) {
      recordsAll = this.filterDataById(id, searchKey, tree);
    }

    const records = recordsAll.slice((current - 1) * size, current * size);

    return successResponse({
      total: recordsAll.length,
      size,
      current,
      records
    });
  }

  async detail(id: string) {
    const record = await this.prisma.dictionary.findFirst({
      where: this.buildDictionaryWhere({ id })
    });
    if (!record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return successResponse(this.toNode(record));
  }

  async create(dto: CreateDictionaryDto) {
    const record =
      dto.parentId && dto.parentId !== '0'
        ? await this.dictionaryItemsService.create(dto)
        : await this.dictionaryTypesService.create(dto);

    return successResponse(this.toNode(record));
  }

  async update(id: string, dto: UpdateDictionaryDto) {
    await this.ensureDictionaryExists(id);

    const current = await this.prisma.dictionary.findUnique({
      where: { id }
    });
    const nextIsItem =
      dto.parentId !== undefined
        ? Boolean(dto.parentId && dto.parentId !== '0')
        : Boolean(current?.parentId);
    const record = nextIsItem
      ? await this.dictionaryItemsService.update(id, dto)
      : await this.dictionaryTypesService.update(id, dto);

    return successResponse(this.toNode(record));
  }

  async remove(id: string) {
    await this.prisma.$transaction(
      async (tx) => {
        const rows = await tx.dictionary.findMany({
          where: this.buildDictionaryWhere()
        });
        const target = rows.find((item) => item.id === id);
        if (!target) {
          throw new BusinessException(
            BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
          );
        }

        const itemNodes = rows
          .filter((item) => item.parentId !== null)
          .map((item) => this.dictionaryItemsService.toNode(item));
        const ids = target.parentId
          ? this.dictionaryItemsService.collectIds(id, itemNodes)
          : [
              id,
              ...this.dictionaryItemsService
                .collectIds(id, itemNodes)
                .filter((itemId) => itemId !== id)
            ];
        await tx.dictionary.deleteMany({
          where: {
            id: { in: ids }
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

  async refreshCache() {
    const result = await this.dictionaryCacheService.refreshCache();
    return successResponse(result);
  }

  private async ensureDictionaryExists(id: string) {
    const record = await this.prisma.dictionary.findFirst({
      where: this.buildDictionaryWhere({ id })
    });
    if (!record) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }
    return record;
  }

  private buildDictionaryWhere(where: Prisma.DictionaryWhereInput = {}) {
    return this.tenantScope.buildWhere(where, 'tenantId', {
      includeGlobal: true
    }) as Prisma.DictionaryWhereInput;
  }

  private getMergedTypeNode(dictValue: string, tree: DictionaryNode[]) {
    const matches = tree.filter((item) => item.dictValue === dictValue);
    if (!matches.length) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND);
    }

    return matches
      .sort((a, b) => this.getNodePriority(a) - this.getNodePriority(b))
      .reduce<DictionaryNode | null>(
        (merged, item) => this.mergeDictionaryNode(merged, item),
        null
      ) as DictionaryNode;
  }

  private getNodePriority(node: DictionaryNode) {
    const currentTenantId = this.tenantScope.getTenantId();

    if (currentTenantId && node.tenantId === currentTenantId) {
      return 2;
    }

    if (node.tenantId === null || node.tenantId === '-1') {
      return 1;
    }

    return 0;
  }

  private toNode(row: Dictionary): DictionaryNode {
    return row.parentId
      ? this.dictionaryItemsService.toNode(row)
      : this.dictionaryTypesService.toNode(row);
  }

  private mergeDictionaryNode(
    current: DictionaryNode | null,
    incoming: DictionaryNode
  ): DictionaryNode {
    if (!current) {
      return this.cloneTree(incoming);
    }

    const children = this.mergeDictionaryChildren(
      current.children || [],
      incoming.children || []
    );

    return this.pruneChildren({
      ...current,
      ...incoming,
      children
    });
  }

  private mergeDictionaryChildren(
    currentChildren: DictionaryNode[],
    incomingChildren: DictionaryNode[]
  ) {
    const merged = new Map<string, DictionaryNode>();

    currentChildren.forEach((item) => {
      merged.set(item.dictValue, this.cloneTree(item));
    });

    incomingChildren.forEach((item) => {
      const existing = merged.get(item.dictValue);
      merged.set(
        item.dictValue,
        existing
          ? this.mergeDictionaryNode(existing, item)
          : this.cloneTree(item)
      );
    });

    return this.sortByCode(Array.from(merged.values()));
  }

  private toOptionItems(nodes: DictionaryNode[]): DictionaryOptionItem[] {
    return this.sortByCode(nodes)
      .filter((item) => item.status)
      .map((item) => {
        const children: DictionaryOptionItem[] = this.toOptionItems(
          item.children || []
        );
        if (!children.length) {
          return {
            label: item.dictLabel,
            value: item.dictValue
          };
        }

        return {
          label: item.dictLabel,
          value: item.dictValue,
          children
        };
      });
  }

  private cloneTree(node: DictionaryNode): DictionaryNode {
    const children = (node.children || []).map((item) => this.cloneTree(item));
    if (!children.length) {
      const { children: _children, ...rest } = node;
      return rest;
    }

    return {
      ...node,
      children
    };
  }

  private pruneChildren(node: DictionaryNode): DictionaryNode {
    const children = (node.children || []).map((item) =>
      this.pruneChildren(item)
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

  private treeToData(tree: DictionaryNode[]) {
    const result: DictionaryNode[] = [];

    const walk = (nodes: DictionaryNode[]) => {
      nodes.forEach((item) => {
        const clone = { ...item };
        result.push(clone);
        if (clone.children?.length) {
          walk(clone.children);
          delete clone.children;
        }
      });
    };

    walk(tree);
    return result;
  }

  private sortByCode(list: DictionaryNode[]) {
    return [...list].sort((a, b) => {
      if (a.sortCode === b.sortCode) {
        return a.name.localeCompare(b.name, 'zh-CN');
      }

      return a.sortCode - b.sortCode;
    });
  }

  private filterDataByKey(searchKey: string, list: DictionaryNode[]) {
    const dataArr: DictionaryNode[] = [];

    const walk = (nodes: DictionaryNode[]) => {
      nodes.forEach((item) => {
        if (item.dictLabel.includes(searchKey)) {
          const clone = { ...item };
          delete clone.children;
          dataArr.push(clone);
          return;
        }

        if (item.children?.length) {
          walk(item.children);
        }
      });
    };

    walk(list);
    return dataArr;
  }

  private getFlattenedRecordsById(id: string, list: DictionaryNode[]) {
    const result: DictionaryNode[] = [];

    const walk = (nodes: DictionaryNode[]) => {
      for (const record of nodes) {
        if (record.id === id) {
          const { children, ...rest } = record;
          result.push(rest);

          children?.forEach((child) => {
            const { children: _children, ...childRest } = child;
            result.push(childRest);
          });
          return true;
        }

        if (record.children?.length && walk(record.children)) {
          return true;
        }
      }

      return false;
    };

    walk(list);
    return result;
  }

  private filterDataById(
    id: string,
    searchKey: string,
    list: DictionaryNode[]
  ) {
    const dataArr: DictionaryNode[] = [];

    const walk = (nodes: DictionaryNode[]) => {
      nodes.forEach((item) => {
        if (item.id === id) {
          if (item.dictLabel.includes(searchKey)) {
            const clone = { ...item };
            delete clone.children;
            dataArr.push(clone);
          }

          item.children?.forEach((child) => {
            if (child.dictLabel.includes(searchKey)) {
              const clone = { ...child };
              delete clone.children;
              dataArr.push(clone);
            }
          });
          return;
        }

        if (item.children?.length) {
          walk(item.children);
        }
      });
    };

    walk(list);
    return dataArr;
  }
}
