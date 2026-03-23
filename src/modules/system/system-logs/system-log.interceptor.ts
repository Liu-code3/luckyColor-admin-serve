import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Observable, mergeMap } from 'rxjs';
import { TenantContextService } from '../../../infra/tenancy/tenant-context.service';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import {
  SYSTEM_LOG_METADATA,
  SystemLogOptions,
  SystemLogTarget
} from './system-log.decorator';
import { SystemLogsService } from './system-logs.service';

interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: JwtPayload;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  header?: (name: string) => string | undefined;
}

@Injectable()
export class SystemLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SystemLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly systemLogsService: SystemLogsService,
    private readonly jwtService: JwtService,
    private readonly tenantContext: TenantContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'http'>() !== 'http') {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<SystemLogOptions>(
      SYSTEM_LOG_METADATA,
      [context.getHandler(), context.getClass()]
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestLike>();

    return next.handle().pipe(
      mergeMap(async (response) => {
        await this.tryCreateLog(request, options);
        return response;
      })
    );
  }

  private async tryCreateLog(request: RequestLike, options: SystemLogOptions) {
    try {
      const user = await this.resolveUser(request);

      if (!user) {
        return;
      }

      await this.systemLogsService.create(
        user,
        {
          module: options.module,
          content: this.buildContent(request, options)
        },
        request
      );
    } catch (error) {
      this.logger.warn(
        `Failed to persist system log for ${request.method ?? 'UNKNOWN'} ${request.url ?? 'UNKNOWN'}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async resolveUser(request: RequestLike) {
    if (request.user) {
      return request.user;
    }

    const token = this.extractBearerToken(request);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const currentTenantId = this.tenantContext.getTenantId();

      if (currentTenantId && currentTenantId !== payload.tenantId) {
        return null;
      }

      if (!currentTenantId && payload.tenantId) {
        this.tenantContext.setTenant(payload.tenantId, 'token');
      }

      return payload;
    } catch {
      return null;
    }
  }

  private extractBearerToken(request: RequestLike) {
    const authorization =
      request.header?.('authorization') ||
      this.getHeaderValue(request.headers, 'authorization');

    if (!authorization) {
      return '';
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return '';
    }

    return token.trim();
  }

  private getHeaderValue(
    headers: Record<string, string | string[] | undefined> | undefined,
    headerName: string
  ) {
    const matchedKey = Object.keys(headers ?? {}).find(
      (key) => key.toLowerCase() === headerName.toLowerCase()
    );

    if (!matchedKey) {
      return '';
    }

    const value = headers?.[matchedKey];

    if (Array.isArray(value)) {
      return value[0] ?? '';
    }

    return value ?? '';
  }

  private buildContent(request: RequestLike, options: SystemLogOptions) {
    const details = (options.targets ?? [])
      .map((target) => this.formatTarget(target, request))
      .filter((item): item is string => !!item);

    if (!details.length) {
      return options.action;
    }

    return `${options.action}: ${details.join(', ')}`;
  }

  private formatTarget(target: SystemLogTarget, request: RequestLike) {
    const sourceValue = this.getSourceValue(request, target);

    if (
      sourceValue === undefined ||
      sourceValue === null ||
      sourceValue === ''
    ) {
      return '';
    }

    return `${target.label ?? target.key}=${this.stringifyValue(sourceValue)}`;
  }

  private getSourceValue(request: RequestLike, target: SystemLogTarget) {
    switch (target.source) {
      case 'body':
        return request.body?.[target.key];
      case 'param':
        return request.params?.[target.key];
      case 'query':
        return request.query?.[target.key];
      default:
        return undefined;
    }
  }

  private stringifyValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.length ? value.map((item) => String(item)).join('|') : '[]';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }

    return String(value);
  }
}
