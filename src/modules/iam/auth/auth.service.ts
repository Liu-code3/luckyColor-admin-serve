import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthButtonPermissionQueryDto, LoginDto } from './auth.dto';
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
  status: boolean;
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
export type AuthRouteNode = {
  path: string;
  name: string;
  component: string;
  redirect?: string;
  meta: Record<string, unknown>;
  children?: AuthRouteNode[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly passwordService: PasswordService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
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
    const user = await this.findUserWithAccess(payload);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return successResponse(this.toAccessSnapshot(user).user);
  }

  async getAccess(payload: JwtPayload) {
    const user = await this.findUserWithAccess(payload);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return successResponse(this.toAccessSnapshot(user));
  }

  async getButtonPermissions(
    payload: JwtPayload,
    query: AuthButtonPermissionQueryDto
  ) {
    const user = await this.findUserWithAccess(payload);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const accessSnapshot = this.toAccessSnapshot(user);
    const buttonCodeList = accessSnapshot.user.buttonCodeList;
    const requestedCodes = query.codes?.length ? query.codes : buttonCodeList;
    const permissionMap = Object.fromEntries(
      requestedCodes.map((code) => [code, buttonCodeList.includes(code)])
    );

    return successResponse({
      buttonCodeList,
      grantedCodeList: requestedCodes.filter((code) => permissionMap[code]),
      permissionMap
    });
  }

  async getRoutes(payload: JwtPayload) {
    const user = await this.findUserWithAccess(payload);

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const accessibleMenus = await this.resolveAccessibleMenus(user);

    return successResponse(this.buildRouteTree(accessibleMenus));
  }

  private async validateUser(dto: LoginDto) {
    const tenantId = this.tenantScope.requireTenantId();

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
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

    if (!user) {
      return null;
    }

    if (!user.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED);
    }

    if (!this.passwordService.isHash(user.password)) {
      if (user.password !== dto.password) {
        return null;
      }

      const passwordHash = await this.passwordService.hash(dto.password);
      const lastLoginAt = new Date();
      await this.prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          password: passwordHash,
          lastLoginAt
        }
      });

      return {
        ...user,
        password: passwordHash,
        lastLoginAt
      };
    }

    const isPasswordValid = await this.passwordService.verify(
      user.password,
      dto.password
    );

    if (!isPasswordValid) {
      return null;
    }

    const lastLoginAt = new Date();
    await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLoginAt
      }
    });

    return {
      ...user,
      lastLoginAt
    };
  }

  private findUserWithAccess(payload: JwtPayload) {
    return this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId
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
    const { roles, menus } = this.resolveAccessContext(user);
    const menuTree = this.buildMenuTree(
      menus.filter((item) => item.type !== 3)
    );

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
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
        tenantId: item.tenantId,
        name: item.name,
        code: item.code
      })),
      menuTree
    };
  }

  private resolveAccessContext(user: AuthUserRecord) {
    if (!user.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED);
    }

    const assignedRoles = user.roles.map((item) => item.role);
    const roles = this.collectRoles(assignedRoles);

    if (assignedRoles.length > 0 && roles.length === 0) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED);
    }

    const menus = this.collectMenus(
      roles.flatMap((role) => role.menus.map((item) => item.menu))
    );

    return {
      roles,
      menus
    };
  }

  private async resolveAccessibleMenus(user: AuthUserRecord) {
    const { menus } = this.resolveAccessContext(user);
    const allMenus = await this.prisma.menu.findMany({
      where: {
        status: true
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    return this.expandMenusWithAncestors(
      allMenus,
      menus.map((item) => item.id)
    ).filter((item) => item.type !== 3);
  }

  private collectRoles(roles: AuthRoleRecord[]) {
    const uniqueRoles = new Map<string, AuthRoleRecord>();

    roles
      .slice()
      .filter((role) => role.status)
      .sort(
        (left, right) =>
          left.sort - right.sort || left.code.localeCompare(right.code)
      )
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
      .filter((menu) => menu.status)
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

  private buildRouteTree(menus: AuthMenuRecord[]) {
    const nodeMap = new Map<number, AuthRouteNode>();
    const parentMap = new Map(menus.map((item) => [item.id, item.parentId]));
    const roots: AuthRouteNode[] = [];

    menus.forEach((menu) => {
      nodeMap.set(menu.id, {
        ...this.toRouteNode(menu),
        children: []
      });
    });

    nodeMap.forEach((node, id) => {
      const parentId = parentMap.get(id);
      if (!parentId) {
        roots.push(node);
        return;
      }

      const parent = nodeMap.get(parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        return;
      }

      roots.push(node);
    });

    return roots.map((item) => this.removeEmptyRouteChildren(item));
  }

  private removeEmptyRouteChildren(node: AuthRouteNode): AuthRouteNode {
    const children = node.children
      ?.slice()
      .map((item) => this.removeEmptyRouteChildren(item));

    if (!children?.length) {
      const { children: _children, ...rest } = node;
      return rest;
    }

    return {
      ...node,
      children
    };
  }

  private removeEmptyChildren(
    node: AuthMenuTreeNode
  ): AuthMenuTreeNode | AuthMenuNode {
    const children: Array<AuthMenuTreeNode | AuthMenuNode> | undefined =
      node.children
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
      status: menu.status,
      component: menu.component,
      redirect: menu.redirect ?? undefined,
      meta: (menu.meta as Record<string, unknown> | null) ?? undefined,
      sort: menu.sort,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt
    };
  }

  private toRouteNode(menu: AuthMenuRecord): AuthRouteNode {
    const meta = {
      title: menu.title,
      icon: menu.icon || undefined,
      hidden: !menu.isVisible,
      order: menu.sort,
      menuKey: menu.menuKey,
      type: menu.type,
      layout: menu.layout || undefined,
      ...((menu.meta as Record<string, unknown> | null) ?? {})
    };

    return {
      path: menu.path,
      name: menu.name,
      component: menu.component,
      redirect: menu.redirect ?? undefined,
      meta
    };
  }

  private expandMenusWithAncestors(
    allMenus: AuthMenuRecord[],
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
}
