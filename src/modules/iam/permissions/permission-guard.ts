import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { BusinessException } from '../../../shared/api/business.exception';
import {
  BUSINESS_ERROR_CODES,
  type BusinessErrorCode
} from '../../../shared/api/error-codes';
import { SUPER_ADMIN_ROLE_CODE } from '../../../shared/constants/access.constants';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import {
  PERMISSION_METADATA,
  type PermissionRequirement
} from './permissions.constants';

interface RequestLike {
  user?: JwtPayload;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      PERMISSION_METADATA,
      [context.getHandler(), context.getClass()]
    );

    if (!requirement?.permissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestLike>();
    const user = request.user;

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const userAccess = await this.prisma.user.findFirst({
      where: {
        id: user.sub,
        tenantId: user.tenantId
      },
      select: {
        roles: {
          select: {
            role: {
              select: {
                code: true,
                status: true,
                menus: {
                  select: {
                    menu: {
                      select: {
                        menuKey: true,
                        status: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userAccess) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const activeRoles = userAccess.roles
      .map((item) => item.role)
      .filter((role) => role.status);

    if (userAccess.roles.length > 0 && activeRoles.length === 0) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED);
    }

    if (activeRoles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE)) {
      return true;
    }

    const permissionSet = new Set(
      activeRoles.flatMap((role) =>
        role.menus
          .filter((item) => item.menu.status)
          .map((item) => item.menu.menuKey)
          .filter(Boolean)
      )
    );

    const hasPermission =
      requirement.mode === 'ALL'
        ? requirement.permissions.every((item) => permissionSet.has(item))
        : requirement.permissions.some((item) => permissionSet.has(item));

    if (!hasPermission) {
      throw new BusinessException(
        (requirement.denialCode as BusinessErrorCode | undefined) ??
          BUSINESS_ERROR_CODES.PERMISSION_DENIED
      );
    }

    return true;
  }
}
