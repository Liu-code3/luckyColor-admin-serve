import { Injectable, NotFoundException } from '@nestjs/common';
import type { Dictionary } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { successResponse } from '../common/api-response';
import {
  createDictionaryId,
  CreateDictionaryDto,
  DictionaryPageQueryDto,
  UpdateDictionaryDto
} from './dictionary.dto';

type DictionaryNode = Omit<Dictionary, 'parentId' | 'createdAt' | 'updatedAt'> & {
  parentId: string;
  children?: DictionaryNode[];
};

@Injectable()
export class DictionaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree() {
    const tree = await this.getDictionaryTree();
    return successResponse(tree, '操作成功');
  }

  async getPage(query: DictionaryPageQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const id = query.id?.trim() || '';
    const searchKey = query.searchKey?.trim() || '';
    const tree = await this.getDictionaryTree();

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
    }, '获取字典分页成功');
  }

  async detail(id: string) {
    const record = await this.prisma.dictionary.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('字典不存在');
    }

    return successResponse(this.toNode(record), '获取字典详情成功');
  }

  async create(dto: CreateDictionaryDto) {
    const record = await this.prisma.dictionary.create({
      data: {
        id: createDictionaryId(dto.id),
        parentId: dto.parentId && dto.parentId !== '0' ? dto.parentId : null,
        weight: dto.weight,
        name: dto.name,
        tenantId: dto.tenantId ?? null,
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

    return successResponse(this.toNode(record), '创建字典成功');
  }

  async update(id: string, dto: UpdateDictionaryDto) {
    await this.ensureDictionaryExists(id);

    const record = await this.prisma.dictionary.update({
      where: { id },
      data: {
        parentId: dto.parentId === undefined
          ? undefined
          : (dto.parentId && dto.parentId !== '0' ? dto.parentId : null),
        weight: dto.weight,
        name: dto.name,
        tenantId: dto.tenantId,
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

    return successResponse(this.toNode(record), '更新字典成功');
  }

  async remove(id: string) {
    const rows = await this.prisma.dictionary.findMany();
    const target = rows.find(item => item.id === id);
    if (!target) {
      throw new NotFoundException('字典不存在');
    }

    const ids = this.collectDictionaryIds(id, rows.map(item => this.toNode(item)));
    await this.prisma.dictionary.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return successResponse(true, '删除字典成功');
  }

  private async getDictionaryTree() {
    const rows = await this.prisma.dictionary.findMany({
      orderBy: [
        { sortCode: 'asc' },
        { name: 'asc' }
      ]
    });

    return this.buildTree(rows.map(row => this.toNode(row)));
  }

  private async ensureDictionaryExists(id: string) {
    const record = await this.prisma.dictionary.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('字典不存在');
    }
    return record;
  }

  private toNode(row: Dictionary): DictionaryNode {
    const { createdAt: _createdAt, updatedAt: _updatedAt, parentId, ...rest } = row;
    return {
      ...rest,
      parentId: parentId ?? '0'
    };
  }

  private buildTree(list: DictionaryNode[]) {
    const nodeMap = new Map<string, DictionaryNode>();
    const roots: DictionaryNode[] = [];

    list.forEach((item) => {
      nodeMap.set(item.id, {
        ...item,
        children: []
      });
    });

    nodeMap.forEach((item) => {
      if (item.parentId === '0') {
        roots.push(item);
        return;
      }

      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      }
      else {
        roots.push(item);
      }
    });

    return roots.map(item => this.pruneEmptyChildren(item));
  }

  private pruneEmptyChildren(node: DictionaryNode): DictionaryNode {
    const children = (node.children || []).map(child => this.pruneEmptyChildren(child));
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

  private filterDataById(id: string, searchKey: string, list: DictionaryNode[]) {
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

  private collectDictionaryIds(rootId: string, rows: DictionaryNode[]) {
    const ids = [rootId];
    const walk = (parentId: string) => {
      rows
        .filter(item => item.parentId === parentId)
        .forEach((item) => {
          ids.push(item.id);
          walk(item.id);
        });
    };
    walk(rootId);
    return ids;
  }
}
