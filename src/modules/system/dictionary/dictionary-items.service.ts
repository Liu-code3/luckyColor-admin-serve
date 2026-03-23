import { Injectable } from '@nestjs/common';
import { Prisma, type Dictionary } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import {
  createDictionaryId,
  type CreateDictionaryDto,
  type UpdateDictionaryDto
} from './dictionary.dto';
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
