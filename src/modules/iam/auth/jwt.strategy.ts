import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantContextService } from '../../../infra/tenancy/tenant-context.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AppConfigService } from '../../../shared/config/app-config.service';
import { TenantAccessService } from '../../tenant/tenants/tenant-access.service';
import type { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    appConfig: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantAccess: TenantAccessService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret
    });
  }

  async validate(payload: JwtPayload) {
    const currentTenantId = this.tenantContext.getTenantId();

    if (currentTenantId && currentTenantId !== payload.tenantId) {
      throw new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED);
    }

    if (!currentTenantId) {
      this.tenantContext.setTenant(payload.tenantId, 'token');
    }

    await this.tenantAccess.assertActiveTenant(payload.tenantId);

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId
      },
      select: {
        status: true,
        roles: {
          select: {
            role: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    if (!user.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED);
    }

    if (user.roles.length > 0 && !user.roles.some((item) => item.role.status)) {
      throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED);
    }

    return payload;
  }
}
