import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import {
  SaveUserPreferencesDto,
  TabPreferencesDto
} from './preferences.dto';

export interface UserTabPreferences {
  enabled: boolean;
  persist: boolean;
  showIcon: boolean;
  draggable: boolean;
}

export interface UserPreferenceSnapshot {
  userId: string;
  layout: string;
  theme: string;
  darkMode: boolean;
  fullscreen: boolean;
  tabPreferences: UserTabPreferences;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface UserPreferenceRecord {
  userId: string;
  layout: string;
  theme: string;
  darkMode: boolean;
  fullscreen: boolean;
  tabPreferences: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TAB_PREFERENCES: UserTabPreferences = {
  enabled: true,
  persist: true,
  showIcon: true,
  draggable: true
};

const DEFAULT_LAYOUT = 'side';
const DEFAULT_THEME = 'default';

@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async detail(user: JwtPayload) {
    const record = await this.findUserPreference(user.sub);
    return successResponse(this.toSnapshot(user.sub, record));
  }

  async save(user: JwtPayload, dto: SaveUserPreferencesDto) {
    const tenantId = this.tenantScope.requireTenantId();
    const existing = await this.findUserPreference(user.sub);
    const current = this.toSnapshot(user.sub, existing);
    const data = {
      layout: this.resolveString(dto.layout, current.layout),
      theme: this.resolveString(dto.theme, current.theme),
      darkMode: dto.darkMode ?? current.darkMode,
      fullscreen: dto.fullscreen ?? current.fullscreen,
      tabPreferences: this.toInputTabPreferences(
        this.mergeTabPreferences(current.tabPreferences, dto.tabPreferences)
      )
    };

    const record = await this.prisma.userPreference.upsert({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.sub
        }
      },
      create: this.tenantScope.buildRequiredData({
        userId: user.sub,
        ...data
      }),
      update: data
    });

    return successResponse(this.toSnapshot(user.sub, record));
  }

  private findUserPreference(userId: string) {
    const tenantId = this.tenantScope.requireTenantId();

    return this.prisma.userPreference.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId
        }
      }
    }) as Promise<UserPreferenceRecord | null>;
  }

  private toSnapshot(
    userId: string,
    record: UserPreferenceRecord | null
  ): UserPreferenceSnapshot {
    if (!record) {
      return {
        userId,
        layout: DEFAULT_LAYOUT,
        theme: DEFAULT_THEME,
        darkMode: false,
        fullscreen: false,
        tabPreferences: { ...DEFAULT_TAB_PREFERENCES },
        createdAt: null,
        updatedAt: null
      };
    }

    return {
      userId,
      layout: this.resolveString(record.layout, DEFAULT_LAYOUT),
      theme: this.resolveString(record.theme, DEFAULT_THEME),
      darkMode: record.darkMode,
      fullscreen: record.fullscreen,
      tabPreferences: this.normalizeTabPreferences(record.tabPreferences),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  private mergeTabPreferences(
    current: UserTabPreferences,
    next?: TabPreferencesDto
  ): UserTabPreferences {
    if (!next) {
      return { ...current };
    }

    return {
      enabled: next.enabled ?? current.enabled,
      persist: next.persist ?? current.persist,
      showIcon: next.showIcon ?? current.showIcon,
      draggable: next.draggable ?? current.draggable
    };
  }

  private normalizeTabPreferences(value: unknown): UserTabPreferences {
    const payload =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};

    return {
      enabled: this.toBoolean(payload.enabled, DEFAULT_TAB_PREFERENCES.enabled),
      persist: this.toBoolean(payload.persist, DEFAULT_TAB_PREFERENCES.persist),
      showIcon: this.toBoolean(
        payload.showIcon,
        DEFAULT_TAB_PREFERENCES.showIcon
      ),
      draggable: this.toBoolean(
        payload.draggable,
        DEFAULT_TAB_PREFERENCES.draggable
      )
    };
  }

  private toBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private toInputTabPreferences(
    value: UserTabPreferences
  ): Prisma.InputJsonObject {
    return {
      enabled: value.enabled,
      persist: value.persist,
      showIcon: value.showIcon,
      draggable: value.draggable
    };
  }

  private resolveString(value: string | undefined, fallback: string) {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  }
}
