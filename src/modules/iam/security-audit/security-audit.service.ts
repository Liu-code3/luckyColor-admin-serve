import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantContextService } from '../../../infra/tenancy/tenant-context.service';
import {
  BUSINESS_ERROR_MESSAGE_MAP,
  type BusinessErrorCode
} from '../../../shared/api/error-codes';
import { extractRequestClientInfo } from '../../../shared/http/request-client-info.util';
import {
  SECURITY_AUDIT_EVENT_TYPES,
  SECURITY_AUDIT_OUTCOMES,
  type SecurityAuditEventType,
  type SecurityAuditOutcome
} from './security-audit.constants';

interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

interface SecurityAuditUser {
  tenantId?: string | null;
  userId?: string | null;
  username?: string | null;
}

interface SecurityAuditRecordOptions extends SecurityAuditUser {
  eventType: SecurityAuditEventType;
  outcome: SecurityAuditOutcome;
  reasonCode?: BusinessErrorCode;
  detail?: Record<string, unknown>;
  request?: RequestLike;
}

interface LoginFailureOptions {
  tenantId?: string | null;
  username?: string | null;
  reasonCode?: BusinessErrorCode;
  detail?: Record<string, unknown>;
  request?: RequestLike;
}

interface PermissionDeniedOptions {
  user: SecurityAuditUser;
  reasonCode?: BusinessErrorCode;
  permissions: string[];
  mode: 'ANY' | 'ALL';
  boundary?: 'ANY' | 'PLATFORM_ADMIN';
  request?: RequestLike;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  async recordLoginSuccess(user: Required<Pick<SecurityAuditUser, 'tenantId' | 'userId' | 'username'>>, request?: RequestLike) {
    await this.record({
      ...user,
      eventType: SECURITY_AUDIT_EVENT_TYPES.LOGIN,
      outcome: SECURITY_AUDIT_OUTCOMES.SUCCESS,
      request
    });
  }

  async recordLoginFailure(options: LoginFailureOptions) {
    await this.record({
      tenantId: options.tenantId,
      username: options.username,
      eventType: SECURITY_AUDIT_EVENT_TYPES.LOGIN,
      outcome: SECURITY_AUDIT_OUTCOMES.FAILURE,
      reasonCode: options.reasonCode,
      detail: options.detail,
      request: options.request
    });
  }

  async recordLogout(
    user: Required<Pick<SecurityAuditUser, 'tenantId' | 'userId' | 'username'>>,
    request?: RequestLike
  ) {
    await this.record({
      ...user,
      eventType: SECURITY_AUDIT_EVENT_TYPES.LOGOUT,
      outcome: SECURITY_AUDIT_OUTCOMES.SUCCESS,
      request
    });
  }

  async recordPermissionDenied(options: PermissionDeniedOptions) {
    await this.record({
      ...options.user,
      eventType: SECURITY_AUDIT_EVENT_TYPES.PERMISSION_DENIED,
      outcome: SECURITY_AUDIT_OUTCOMES.DENIED,
      reasonCode: options.reasonCode,
      detail: {
        permissions: options.permissions,
        mode: options.mode,
        boundary: options.boundary ?? 'ANY'
      },
      request: options.request
    });
  }

  private async record(options: SecurityAuditRecordOptions) {
    try {
      const clientInfo = extractRequestClientInfo(options.request);
      const tenantId =
        options.tenantId ?? this.tenantContext.getTenantId() ?? null;

      await this.prisma.securityAuditLog.create({
        data: {
          tenantId,
          userId: options.userId ?? null,
          username: options.username?.trim() || null,
          eventType: options.eventType,
          outcome: options.outcome,
          reasonCode: options.reasonCode,
          reasonMessage: options.reasonCode
            ? BUSINESS_ERROR_MESSAGE_MAP[options.reasonCode]
            : null,
          requestMethod: options.request?.method?.trim() || null,
          requestPath: options.request?.url?.trim() || null,
          ipAddress: clientInfo.ipAddress,
          browserVersion: clientInfo.browserVersion,
          terminalSystem: clientInfo.terminalSystem,
          detail: options.detail
            ? (options.detail as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist security audit log: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
