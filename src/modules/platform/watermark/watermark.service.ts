import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';

export interface EffectiveWatermarkSnapshot {
  enabled: boolean;
  content: string;
  opacity: number;
  color: string;
  fontSize: number;
  rotation: number;
  source:
    | 'DEFAULT'
    | 'SYSTEM'
    | 'TENANT'
    | 'SYSTEM_SWITCH'
    | 'TENANT_PACKAGE';
}

interface WatermarkLikeRecord {
  tenantId: string | null;
  content: string | null;
  opacity: number | null;
  color: string | null;
  fontSize: number | null;
  rotation: number | null;
  status: boolean | null;
}

const DEFAULT_WATERMARK: EffectiveWatermarkSnapshot = {
  enabled: true,
  content: 'LuckyColor Admin',
  opacity: 0.15,
  color: '#1f2937',
  fontSize: 16,
  rotation: -22,
  source: 'DEFAULT'
};

@Injectable()
export class WatermarkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async current(user: JwtPayload) {
    const tenantId = this.tenantScope.requireTenantId();
    const [tenant, systemSwitch, systemConfig, tenantConfig] =
      await Promise.all([
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            tenantPackage: {
              select: {
                featureFlags: true
              }
            }
          }
        }),
        this.prisma.systemConfig.findFirst({
          where: {
            configKey: 'sys.enable_watermark',
            status: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        this.prisma.watermarkConfig.findFirst({
          where: {
            tenantId: null
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        this.prisma.watermarkConfig.findFirst({
          where: {
            tenantId
          },
          orderBy: {
            updatedAt: 'desc'
          }
        })
      ]);

    const packageWatermarkEnabled = this.resolveFeatureFlag(
      tenant?.tenantPackage?.featureFlags,
      'watermark',
      true
    );
    const systemWatermarkEnabled = this.parseBooleanString(
      systemSwitch?.configValue,
      true
    );
    const effective = this.resolveEffectiveWatermark(
      systemConfig as WatermarkLikeRecord | null,
      tenantConfig as WatermarkLikeRecord | null
    );

    if (!packageWatermarkEnabled) {
      return successResponse({
        ...effective,
        enabled: false,
        source: 'TENANT_PACKAGE'
      });
    }

    if (!systemWatermarkEnabled) {
      return successResponse({
        ...effective,
        enabled: false,
        source: 'SYSTEM_SWITCH'
      });
    }

    return successResponse(effective);
  }

  private resolveEffectiveWatermark(
    systemConfig: WatermarkLikeRecord | null,
    tenantConfig: WatermarkLikeRecord | null
  ): EffectiveWatermarkSnapshot {
    const base = {
      ...DEFAULT_WATERMARK
    };

    const withSystem = systemConfig
      ? this.applyConfig(base, systemConfig, 'SYSTEM')
      : base;

    if (!tenantConfig) {
      return withSystem;
    }

    return this.applyConfig(withSystem, tenantConfig, 'TENANT');
  }

  private applyConfig(
    base: EffectiveWatermarkSnapshot,
    config: WatermarkLikeRecord,
    source: EffectiveWatermarkSnapshot['source']
  ): EffectiveWatermarkSnapshot {
    return {
      enabled: config.status ?? base.enabled,
      content: this.resolveString(config.content, base.content),
      opacity: this.resolveNumber(config.opacity, base.opacity),
      color: this.resolveString(config.color, base.color),
      fontSize: this.resolveNumber(config.fontSize, base.fontSize),
      rotation: this.resolveNumber(config.rotation, base.rotation),
      source
    };
  }

  private resolveFeatureFlag(
    value: unknown,
    key: string,
    fallback: boolean
  ) {
    if (!value || typeof value !== 'object') {
      return fallback;
    }

    const featureFlags = value as Record<string, unknown>;
    const featureValue = featureFlags[key];

    return typeof featureValue === 'boolean' ? featureValue : fallback;
  }

  private parseBooleanString(value: string | null | undefined, fallback: boolean) {
    if (value === undefined || value === null) {
      return fallback;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    return fallback;
  }

  private resolveString(value: string | null, fallback: string) {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  }

  private resolveNumber(value: number | null, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : fallback;
  }
}
