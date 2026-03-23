import { Injectable, Logger } from '@nestjs/common';
import type { Dictionary } from '../../../generated/prisma';
import { RedisService } from '../../../infra/cache/redis/redis.service';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import type { DictionaryNode } from './dictionary.models';

interface DictionaryCacheSnapshot {
  cacheKey: string;
  count: number;
  refreshedAt: string;
  tree: DictionaryNode[];
}

@Injectable()
export class DictionaryCacheService {
  private readonly logger = new Logger(DictionaryCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async getTree() {
    const cacheKey = this.getCacheKey();

    try {
      const client = await this.ensureRedisClient();
      const cached = await client.get(cacheKey);
      if (cached) {
        const snapshot = JSON.parse(cached) as DictionaryCacheSnapshot;
        return snapshot.tree;
      }
    } catch (error) {
      this.logger.warn(
        `读取字典缓存失败，改为回源数据库: ${this.stringifyError(error)}`
      );
    }

    const snapshot = await this.buildSnapshot();

    try {
      const client = await this.ensureRedisClient();
      await client.set(cacheKey, JSON.stringify(snapshot));
    } catch (error) {
      this.logger.warn(
        `写入字典缓存失败，已返回数据库结果: ${this.stringifyError(error)}`
      );
    }

    return snapshot.tree;
  }

  async refreshCache() {
    const snapshot = await this.buildSnapshot();
    const client = await this.ensureRedisClient();
    await client.set(snapshot.cacheKey, JSON.stringify(snapshot));

    return {
      cacheKey: snapshot.cacheKey,
      count: snapshot.count,
      refreshedAt: snapshot.refreshedAt
    };
  }

  async refreshCacheSafely() {
    try {
      return await this.refreshCache();
    } catch (error) {
      this.logger.warn(
        `刷新字典缓存失败，忽略本次缓存更新: ${this.stringifyError(error)}`
      );
      return null;
    }
  }

  private async buildSnapshot(): Promise<DictionaryCacheSnapshot> {
    const rows = await this.prisma.dictionary.findMany({
      where: this.buildDictionaryWhere(),
      orderBy: [{ sortCode: 'asc' }, { name: 'asc' }]
    });
    const typeRows = rows.filter((item) => item.parentId === null);
    const itemRows = rows.filter((item) => item.parentId !== null);
    const itemForest = this.buildForest(itemRows);
    const tree = typeRows.map((item) => {
      const node = this.toNode(item);
      const children = itemForest.get(item.id);

      if (!children?.length) {
        return node;
      }

      return {
        ...node,
        children
      };
    });

    return {
      cacheKey: this.getCacheKey(),
      count: rows.length,
      refreshedAt: new Date().toISOString(),
      tree
    };
  }

  private buildForest(rows: Dictionary[]) {
    const nodes = rows.map((row) => ({
      ...this.toNode(row),
      children: [] as DictionaryNode[]
    }));
    const nodeMap = new Map<string, DictionaryNode>();
    const rootsByParent = new Map<string, DictionaryNode[]>();

    nodes.forEach((item) => {
      nodeMap.set(item.id, item);
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

  private pruneEmptyChildren(node: DictionaryNode): DictionaryNode {
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

  private toNode(row: Dictionary): DictionaryNode {
    const { parentId, ...rest } = row;

    return {
      ...rest,
      parentId: parentId ?? '0'
    };
  }

  private getCacheKey() {
    const tenantId = this.tenantScope.getTenantId();
    return `system:dictionaries:tree:${tenantId ?? 'platform'}`;
  }

  private buildDictionaryWhere() {
    return this.tenantScope.buildWhere({}, 'tenantId', {
      includeGlobal: true
    });
  }

  private async ensureRedisClient() {
    const client = this.redisService.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }

    return client;
  }

  private stringifyError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
