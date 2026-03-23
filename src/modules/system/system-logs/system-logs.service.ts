import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { extractRequestClientInfo } from '../../../shared/http/request-client-info.util';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import {
  CreateSystemLogDto,
  SystemLogListQueryDto
} from './system-logs.dto';

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

@Injectable()
export class SystemLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async list(query: SystemLogListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const where = this.buildWhere({
      module: query.module?.trim()
        ? {
            contains: query.module.trim()
          }
        : undefined,
      operatorName: query.operator?.trim()
        ? {
            contains: query.operator.trim()
          }
        : undefined,
      content: query.keyword?.trim()
        ? {
            contains: query.keyword.trim()
          }
        : undefined
    });

    const [total, records] = await this.prisma.$transaction([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map(item => this.toResponse(item))
    });
  }

  async detail(id: string) {
    const log = await this.prisma.systemLog.findFirst({
      where: this.buildWhere({ id })
    });

    if (!log) {
      throw new BusinessException(BUSINESS_ERROR_CODES.SYSTEM_LOG_NOT_FOUND);
    }

    return successResponse(this.toResponse(log));
  }

  async create(
    user: JwtPayload,
    dto: CreateSystemLogDto,
    request?: RequestLike
  ) {
    const tenantId = this.tenantScope.requireTenantId();
    const operator = await this.prisma.user.findFirst({
      where: {
        id: user.sub,
        tenantId
      },
      select: {
        nickname: true
      }
    });
    const clientInfo = extractRequestClientInfo(request);
    const log = await this.prisma.systemLog.create({
      data: {
        tenantId,
        operatorUserId: user.sub,
        operatorName: operator?.nickname?.trim() || user.username,
        module: dto.module.trim(),
        content: dto.content.trim(),
        ipAddress: clientInfo.ipAddress,
        region: dto.region?.trim() || '未知',
        browserVersion: clientInfo.browserVersion,
        terminalSystem: clientInfo.terminalSystem
      }
    });

    return successResponse(this.toResponse(log));
  }

  private buildWhere(where: Prisma.SystemLogWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.SystemLogWhereInput;
  }

  private toResponse(log: {
    id: string;
    tenantId: string;
    operatorUserId: string;
    operatorName: string;
    module: string;
    content: string;
    ipAddress: string;
    region: string;
    browserVersion: string;
    terminalSystem: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: log.id,
      tenantId: log.tenantId,
      operatorUserId: log.operatorUserId,
      operatorName: log.operatorName,
      module: log.module,
      content: log.content,
      ipAddress: log.ipAddress,
      region: log.region,
      browserVersion: log.browserVersion,
      terminalSystem: log.terminalSystem,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    };
  }
}
