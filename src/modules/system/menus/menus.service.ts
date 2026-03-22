import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import { CreateMenuDto, MenuListQueryDto, UpdateMenuDto } from './menus.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MenuListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const title = query.title?.trim();
    const where = title
      ? {
          title: { contains: title }
        }
      : {};

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

  async tree() {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    return successResponse(
      this.buildTree(menus.map((item) => this.toMenuResponse(item)))
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
    try {
      const menu = await this.prisma.$transaction(
        async (tx) => {
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
              component: dto.component,
              redirect: dto.redirect ?? null,
              meta: (dto.meta ?? undefined) as Prisma.InputJsonValue | undefined,
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
    await this.ensureMenuExists(id);

    const menu = await this.prisma.menu.update({
      where: { id },
      data: {
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
        sort: dto.sort
      }
    });

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

  private async ensureMenuExists(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new BusinessException(BUSINESS_ERROR_CODES.MENU_NOT_FOUND);
    }
    return menu;
  }

  private collectMenuIds(
    rootId: number,
    menus: Array<{ id: number; parentId: number | null }>
  ) {
    const ids = [rootId];
    const loop = (parentId: number) => {
      menus
        .filter((item) => item.parentId === parentId)
        .forEach((item) => {
          ids.push(item.id);
          loop(item.id);
        });
    };
    loop(rootId);
    return ids;
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
      component: menu.component,
      redirect: menu.redirect ?? undefined,
      meta: (menu.meta as Record<string, unknown> | null) ?? undefined,
      sort: menu.sort,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt
    };
  }
}
