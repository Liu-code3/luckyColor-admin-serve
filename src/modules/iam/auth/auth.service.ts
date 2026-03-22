import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { errorResponse, successResponse } from '../../../shared/api/api-response';
import { LoginDto, MenuListDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.adminName
      }
    });

    if (!user || user.password !== dto.password) {
      return errorResponse('登录失败');
    }

    return successResponse(user.token, '登录成功~');
  }

  async getMenuList(dto: MenuListDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        token: dto.token
      }
    });

    if (!user) {
      return errorResponse('获取菜单失败');
    }

    const menus = await this.prisma.menu.findMany({
      orderBy: [
        { sort: 'asc' },
        { id: 'asc' }
      ]
    });

    return successResponse(
      menus.map(menu => this.toMenuResponse(menu)),
      '获取菜单成功~'
    );
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
      meta: (menu.meta as Record<string, unknown> | null) ?? undefined
    };
  }
}
