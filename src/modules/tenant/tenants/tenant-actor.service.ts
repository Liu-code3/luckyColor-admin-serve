import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { BusinessException } from '../../../shared/api/business.exception';
import {
  BUSINESS_ERROR_CODES,
  type BusinessErrorCode
} from '../../../shared/api/error-codes';
import {
  SUPER_ADMIN_ROLE_CODE,
  TENANT_ADMIN_ROLE_CODE
} from '../../../shared/constants/access.constants';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';

export type TenantActorBoundary =
  | 'PLATFORM_ADMIN'
  | 'TENANT_ADMIN'
  | 'TENANT_USER';

export interface TenantActorProfile {
  boundary: TenantActorBoundary;
  roleCodes: string[];
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
}

type TenantActorRecord = Prisma.UserGetPayload<{
  select: {
    status: true;
    roles: {
      select: {
        role: {
          select: {
            code: true;
            status: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class TenantActorService {
  constructor(private readonly prisma: PrismaService) {}

  isPlatformAdmin(roleCodes: string[]) {
    return roleCodes.includes(SUPER_ADMIN_ROLE_CODE);
  }

  isTenantAdmin(roleCodes: string[]) {
    return !this.isPlatformAdmin(roleCodes) && roleCodes.includes(TENANT_ADMIN_ROLE_CODE);
  }

  resolveBoundary(roleCodes: string[]): TenantActorBoundary {
    if (this.isPlatformAdmin(roleCodes)) {
      return 'PLATFORM_ADMIN';
    }

    if (this.isTenantAdmin(roleCodes)) {
      return 'TENANT_ADMIN';
    }

    return 'TENANT_USER';
  }

  async resolveProfile(user: JwtPayload): Promise<TenantActorProfile> {
    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: user.sub,
        tenantId: user.tenantId
      },
      select: {
        status: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!currentUser) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return this.resolveProfileFromRecord(currentUser);
  }

  async assertPlatformAdmin(
    user: JwtPayload,
    denialCode: BusinessErrorCode = BUSINESS_ERROR_CODES.PERMISSION_DENIED
  ) {
    const profile = await this.resolveProfile(user);
    if (!profile.isPlatformAdmin) {
      throw new BusinessException(denialCode);
    }

    return profile;
  }

  private resolveProfileFromRecord(user: TenantActorRecord): TenantActorProfile {
    if (!user.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED);
    }

    const activeRoleCodes = user.roles
      .map((item) => item.role)
      .filter((role) => role.status)
      .map((role) => role.code)
      .filter((code): code is string => Boolean(code));

    if (user.roles.length > 0 && activeRoleCodes.length === 0) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED);
    }

    const boundary = this.resolveBoundary(activeRoleCodes);

    return {
      boundary,
      roleCodes: activeRoleCodes,
      isPlatformAdmin: boundary === 'PLATFORM_ADMIN',
      isTenantAdmin: boundary === 'TENANT_ADMIN'
    };
  }
}
