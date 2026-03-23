import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import {
  CreateMenuDto,
  MenuListQueryDto,
  MenuTreeQueryDto,
  SyncMenusDto,
  UpdateMenuDto,
  UpdateMenuStatusDto
} from './menus.dto';

@Injectable()
export class MenusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async list(query: MenuListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const title = query.title?.trim();
    const where: Prisma.MenuWhereInput = {
      title: title
        ? {
            contains: title
          }
        : undefined,
      status: query.status
    };

    const [total, records] = await this.prisma.$transaction([
      this.prisma.menu.count({ where }),
      this.prisma.menu.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toMenuResponse(item))
    });
  }

  async tree(query: MenuTreeQueryDto) {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });
    const scopedMenus = query.roleId
      ? await this.resolveRoleScopedMenus(query.roleId, menus)
      : query.view === 'tenant'
        ? await this.resolveTenantScopedMenus(menus)
        : menus;

    return successResponse(
      this.buildTree(scopedMenus.map((item) => this.toMenuResponse(item)))
    );
  }

  async detail(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
    }

    return successResponse(this.toMenuResponse(menu));
  }

  async create(dto: CreateMenuDto) {
    await this.ensureMenuKeyAvailable(dto.menuKey);

    try {
      const menu = await this.prisma.$transaction(
        async (tx) => {
          await this.validateMenuHierarchy(
            dto.parentId ?? null,
            dto.type,
            dto.id,
            tx
          );

          const created = await tx.menu.create({
            data: {
              id: dto.id,
              parentId: dto.parentId ?? null,
              title: dto.title,
              name: dto.name,
              type: dto.type,
              path: dto.path,
              menuKey: dto.menuKey,
              icon: dto.icon ?? '',
              layout: dto.layout ?? '',
              isVisible: dto.isVisible,
              status: dto.status ?? true,
              component: dto.component,
              redirect: dto.redirect ?? null,
              meta: (dto.meta ?? undefined) as
                | Prisma.InputJsonValue
                | undefined,
              sort: dto.sort ?? 0
            }
          });

          if (dto.sort !== undefined) {
            return created;
          }

          return tx.menu.update({
            where: { id: created.id },
            data: {
              sort: created.id
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      return successResponse(this.toMenuResponse(menu));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error, ['id']);
    }
  }

  async update(id: number, dto: UpdateMenuDto) {
    const existing = await this.ensureMenuExists(id);

    if (dto.menuKey) {
      await this.ensureMenuKeyAvailable(dto.menuKey, id);
    }

    if (dto.parentId !== undefined || dto.type !== undefined) {
      await this.validateMenuHierarchy(
        dto.parentId === undefined ? existing.parentId : dto.parentId,
        dto.type ?? existing.type,
        id
      );
    }

    const menu = await this.prisma.$transaction(
      async (tx) =>
        this.updateMenuWithStatus(tx, id, {
          parentId: dto.parentId,
          title: dto.title,
          name: dto.name,
          type: dto.type,
          path: dto.path,
          menuKey: dto.menuKey,
          icon: dto.icon,
          layout: dto.layout,
          isVisible: dto.isVisible,
          component: dto.component,
          redirect: dto.redirect === undefined ? undefined : dto.redirect,
          meta:
            dto.meta === undefined
              ? undefined
              : (dto.meta as
                  | Prisma.InputJsonValue
                  | Prisma.NullableJsonNullValueInput),
          sort: dto.sort,
          status: dto.status
        }),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return successResponse(this.toMenuResponse(menu));
  }

  async updateStatus(id: number, dto: UpdateMenuStatusDto) {
    await this.ensureMenuExists(id);

    const menu = await this.prisma.$transaction(
      async (tx) =>
        this.updateMenuWithStatus(tx, id, {
          status: dto.status
        }),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return successResponse(this.toMenuResponse(menu));
  }

  async remove(id: number) {
    await this.prisma.$transaction(
      async (tx) => {
        const menus = await tx.menu.findMany();
        const target = menus.find((item) => item.id === id);
        if (!target) {
          throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
        }

        const ids = this.collectMenuIds(id, menus);
        await tx.menu.deleteMany({
          where: {
            id: { in: ids }
          }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return successResponse(true);
  }

  async sync(dto: SyncMenusDto) {
    const uniqueIds = new Set(dto.menus.map((item) => item.id));
    if (uniqueIds.size !== dto.menus.length) {
      throw new BusinessException(BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const menus = await tx.menu.findMany({
          orderBy: [{ sort: 'asc' }, { id: 'asc' }]
        });
        const menuMap = new Map(menus.map((item) => [item.id, item]));

        if (dto.menus.some((item) => !menuMap.has(item.id))) {
          throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
        }

        const syncMap = new Map(dto.menus.map((item) => [item.id, item]));
        const nextMenus = menus.map((item) => {
          const target = syncMap.get(item.id);
          if (!target) {
            return item;
          }

          return {
            ...item,
            parentId: target.parentId ?? null,
            sort: target.sort
          };
        });

        dto.menus.forEach((item) => {
          const target = nextMenus.find((menu) => menu.id === item.id)!;
          this.assertMenuHierarchy(
            target.parentId,
            target.type,
            nextMenus,
            target.id
          );
        });

        for (const item of dto.menus) {
          await tx.menu.update({
            where: { id: item.id },
            data: {
              parentId: item.parentId ?? null,
              sort: item.sort
            }
          });
        }

        const updatedMenus = await tx.menu.findMany({
          orderBy: [{ sort: 'asc' }, { id: 'asc' }]
        });

        return successResponse(
          this.buildTree(updatedMenus.map((item) => this.toMenuResponse(item)))
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );
  }

  private async ensureMenuExists(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
    }
    return menu;
  }

  private async updateMenuWithStatus(
    tx: Prisma.TransactionClient,
    id: number,
    data: Prisma.MenuUpdateInput
  ) {
    if (data.status !== false) {
      return tx.menu.update({
        where: { id },
        data
      });
    }

    const menus = await tx.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });
    const ids = this.collectMenuIds(id, menus);

    if (ids.length > 1) {
      await tx.menu.updateMany({
        where: {
          id: {
            in: ids.filter((item) => item !== id)
          }
        },
        data: {
          status: false
        }
      });
    }

    return tx.menu.update({
      where: { id },
      data
    });
  }

  private async ensureMenuKeyAvailable(menuKey: string, excludeId?: number) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        menuKey,
        id: excludeId ? { not: excludeId } : undefined
      }
    });

    if (menu) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async validateMenuHierarchy(
    parentId: number | null,
    type: number,
    currentId?: number,
    tx: Pick<PrismaService, 'menu'> = this.prisma
  ) {
    const menus = await tx.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    this.assertMenuHierarchy(parentId, type, menus, currentId);
  }

  private assertMenuHierarchy(
    parentId: number | null,
    type: number,
    menus: Array<{ id: number; parentId: number | null; type: number }>,
    currentId?: number
  ) {
    if (parentId === null) {
      if (type === 3) {
        throw new BusinessException(
          BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID
        );
      }

      return;
    }

    if (currentId !== undefined && parentId === currentId) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID);
    }

    const parent = menus.find((item) => item.id === parentId);

    if (!parent) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
    }

    if (parent.type === 3) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID);
    }

    if (currentId !== undefined) {
      const descendantIds = new Set(this.collectMenuIds(currentId, menus));
      if (descendantIds.has(parentId)) {
        throw new BusinessException(
          BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID
        );
      }
    }
  }

  private async resolveRoleScopedMenus(
    roleId: string,
    allMenus: Prisma.MenuGetPayload<Record<string, never>>[]
  ) {
    const role = await this.prisma.role.findFirst({
      where: this.tenantScope.buildRequiredWhere(
        {
          id: roleId
        },
        'tenantId'
      ) as Prisma.RoleWhereInput,
      include: {
        menus: {
          include: {
            menu: true
          }
        }
      }
    });

    if (!role) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
    }

    return this.expandMenusWithAncestors(
      allMenus,
      role.menus.map((item) => item.menuId)
    );
  }

  private async resolveTenantScopedMenus(
    allMenus: Prisma.MenuGetPayload<Record<string, never>>[]
  ) {
    const tenantId = this.tenantScope.requireTenantId();
    const roleMenus = await this.prisma.roleMenu.findMany({
      where: {
        tenantId
      }
    });

    return this.expandMenusWithAncestors(
      allMenus,
      roleMenus.map((item) => item.menuId)
    );
  }

  private collectMenuIds(
    rootId: number,
    menus: Array<{ id: number; parentId: number | null }>
  ) {
    const ids = [rootId];
    const visited = new Set<number>(ids);
    const loop = (parentId: number) => {
      menus
        .filter((item) => item.parentId === parentId)
        .forEach((item) => {
          if (visited.has(item.id)) {
            return;
          }

          visited.add(item.id);
          ids.push(item.id);
          loop(item.id);
        });
    };
    loop(rootId);
    return ids;
  }

  private expandMenusWithAncestors(
    allMenus: Prisma.MenuGetPayload<Record<string, never>>[],
    selectedIds: number[]
  ) {
    const menuMap = new Map(allMenus.map((item) => [item.id, item]));
    const expandedIds = new Set<number>();

    selectedIds.forEach((menuId) => {
      let current = menuMap.get(menuId);

      while (current) {
        if (expandedIds.has(current.id)) {
          break;
        }

        expandedIds.add(current.id);
        current =
          current.parentId === null ? undefined : menuMap.get(current.parentId);
      }
    });

    return allMenus.filter((item) => expandedIds.has(item.id));
  }

  private buildTree(items: Array<ReturnType<MenusService['toMenuResponse']>>) {
    const map = new Map<
      number,
      ReturnType<MenusService['toMenuResponse']> & {
        children?: Array<ReturnType<MenusService['toMenuResponse']>>;
      }
    >();
    const roots: Array<
      ReturnType<MenusService['toMenuResponse']> & {
        children?: Array<ReturnType<MenusService['toMenuResponse']>>;
      }
    > = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    map.forEach((item) => {
      if (!item.pid) {
        roots.push(item);
        return;
      }

      const parent = map.get(item.pid);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots.map((item) => {
      if (!item.children?.length) {
        const { children: _children, ...rest } = item;
        return rest;
      }
      return item;
    });
  }

  private toMenuResponse(menu: Prisma.MenuGetPayload<Record<string, never>>) {
    return {
      pid: menu.parentId ?? 0,
      id: menu.id,
      title: menu.title,
      name: menu.name,
      type: menu.type,
      path: menu.path,
      key: menu.menuKey,
      icon: menu.icon ?? '',
      layout: menu.layout ?? '',
      isVisible: menu.isVisible,
      status: menu.status,
      component: menu.component,
      redirect: menu.redirect ?? undefined,
      meta: (menu.meta as Record<string, unknown> | null) ?? undefined,
      sort: menu.sort,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt
    };
  }
}
