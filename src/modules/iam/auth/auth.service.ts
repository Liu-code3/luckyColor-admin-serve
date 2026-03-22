import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { LoginDto } from './auth.dto';
import type { JwtPayload } from './jwt-payload.interface';

type AuthUserRecord = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            menus: {
              include: {
                menu: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type AuthRoleRecord = Prisma.RoleGetPayload<{
  include: {
    menus: {
      include: {
        menu: true;
      };
    };
  };
}>;

type AuthMenuRecord = Prisma.MenuGetPayload<Record<string, never>>;
type AuthMenuNode = {
  pid: number;
  id: number;
  title: string;
  name: string;
  type: number;
  path: string;
  key: string;
  icon: string;
  layout: string;
  isVisible: boolean;
  component: string;
  redirect?: string;
  meta?: Record<string, unknown>;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
};
type AuthMenuTreeNode = AuthMenuNode & {
  children?: AuthMenuTreeNode[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const accessSnapshot = this.toAccessSnapshot(user);

    return successResponse({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '2h',
      user: accessSnapshot.user
    });
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.findUserWithAccess(payload.sub);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return successResponse(this.toAccessSnapshot(user).user);
  }

  async getAccess(payload: JwtPayload) {
    const user = await this.findUserWithAccess(payload.sub);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return successResponse(this.toAccessSnapshot(user));
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.password !== dto.password) {
      return null;
    }

    return user;
  }

  private findUserWithAccess(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  private toAccessSnapshot(user: AuthUserRecord) {
    const roles = this.collectRoles(user.roles.map((item) => item.role));
    const menus = this.collectMenus(
      roles.flatMap((role) => role.menus.map((item) => item.menu))
    );
    const menuTree = this.buildMenuTree(menus.filter((item) => item.type !== 3));

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        roleCodes: roles.map((item) => item.code),
        menuCodeList: menus
          .filter((item) => item.type !== 3)
          .map((item) => item.menuKey),
        buttonCodeList: menus
          .filter((item) => item.type === 3)
          .map((item) => item.menuKey)
      },
      roles: roles.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code
      })),
      menuTree
    };
  }

  private collectRoles(roles: AuthRoleRecord[]) {
    const uniqueRoles = new Map<string, AuthRoleRecord>();

    roles
      .slice()
      .sort((left, right) => left.sort - right.sort || left.code.localeCompare(right.code))
      .forEach((role) => {
        if (!uniqueRoles.has(role.id)) {
          uniqueRoles.set(role.id, role);
        }
      });

    return Array.from(uniqueRoles.values());
  }

  private collectMenus(menus: AuthMenuRecord[]) {
    const uniqueMenus = new Map<number, AuthMenuRecord>();

    menus
      .slice()
      .sort((left, right) => left.sort - right.sort || left.id - right.id)
      .forEach((menu) => {
        if (!uniqueMenus.has(menu.id)) {
          uniqueMenus.set(menu.id, menu);
        }
      });

    return Array.from(uniqueMenus.values());
  }

  private buildMenuTree(menus: AuthMenuRecord[]) {
    const nodeMap = new Map<number, AuthMenuTreeNode>();
    const roots: AuthMenuTreeNode[] = [];

    menus.forEach((menu) => {
      nodeMap.set(menu.id, {
        ...this.toMenuNode(menu),
        children: []
      });
    });

    nodeMap.forEach((node) => {
      if (!node.pid) {
        roots.push(node);
        return;
      }

      const parent = nodeMap.get(node.pid);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        return;
      }

      roots.push(node);
    });

    return roots.map((item) => this.removeEmptyChildren(item));
  }

  private removeEmptyChildren(
    node: AuthMenuTreeNode
  ): AuthMenuTreeNode | AuthMenuNode {
    const children: Array<AuthMenuTreeNode | AuthMenuNode> | undefined = node.children
      ?.slice()
      .sort((left, right) => left.sort - right.sort || left.id - right.id)
      .map((item) => this.removeEmptyChildren(item));

    if (!children?.length) {
      const { children: _children, ...rest } = node;
      return rest;
    }

    return {
      ...node,
      children
    };
  }

  private toMenuNode(menu: AuthMenuRecord): AuthMenuNode {
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
