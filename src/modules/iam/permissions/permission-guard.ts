import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { BusinessException } from '../../../shared/api/business.exception';
import {
  BUSINESS_ERROR_CODES,
  type BusinessErrorCode
} from '../../../shared/api/error-codes';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { TenantActorService } from '../../tenant/tenants/tenant-actor.service';
import { collectGrantedPermissionCodes } from './permission-point.util';
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
    private readonly prisma: PrismaService,
    private readonly tenantActor: TenantActorService
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
                permissions: {
                  select: {
                    permissionCode: true
                  }
                },
                menus: {
                  select: {
                    menu: {
                      select: {
                        menuKey: true,
                        permissionCode: true,
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

    const roleCodes = activeRoles
      .map((role) => role.code)
      .filter((code): code is string => Boolean(code));

    if (
      requirement.boundary === 'PLATFORM_ADMIN' &&
      !this.tenantActor.isPlatformAdmin(roleCodes)
    ) {
      throw new BusinessException(
        (requirement.denialCode as BusinessErrorCode | undefined) ??
          BUSINESS_ERROR_CODES.PERMISSION_DENIED
      );
    }

    if (this.tenantActor.isPlatformAdmin(roleCodes)) {
      return true;
    }

    const permissionSet = collectGrantedPermissionCodes(activeRoles);

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
