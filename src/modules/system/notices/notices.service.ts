import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import {
  NOTICE_PUBLISH_SCOPE_DEPARTMENT,
  NOTICE_PUBLISH_SCOPE_ROLE,
  NOTICE_PUBLISH_SCOPE_TENANT_ALL,
  type NoticePublishScope
} from '../../../shared/constants/notice.constants';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  NOTICE_STATUS_DRAFT,
  NOTICE_STATUS_PUBLISHED
} from '../../../shared/constants/status.constants';
import { resolveSortOrder } from '../../../shared/api/list-query.util';
import {
  CreateNoticeDto,
  NoticeListQueryDto,
  PinNoticeDto,
  PublishNoticeDto,
  UpdateNoticeDto
} from './notices.dto';

interface NoticeVisibilityProfile {
  departmentId: number | null;
  roleCodes: string[];
}

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async list(query: NoticeListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const type = query.type?.trim();
    const filters: Prisma.NoticeWhereInput[] = [];

    if (keyword) {
      filters.push({
        title: { contains: keyword }
      });
    }

    if (type) {
      filters.push({ type });
    }

    if (query.status !== undefined) {
      filters.push({ status: query.status });
    }

    if (query.publishScope) {
      filters.push({ publishScope: query.publishScope });
    }

    const baseWhere =
      filters.length === 0
        ? undefined
        : filters.length === 1
          ? filters[0]
          : { AND: filters };
    const where = this.buildNoticeWhere(baseWhere);
    const orderBy = this.buildListOrderBy(query);

    const [total, records] = await this.prisma.$transaction([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        orderBy,
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toNoticeResponse(item))
    });
  }

  async detail(id: string) {
    const notice = await this.prisma.notice.findFirst({
      where: this.buildNoticeWhere({ id })
    });
    if (!notice) {
      throw new BusinessException(BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND);
    }

    return successResponse(this.toNoticeResponse(notice));
  }

  async create(dto: CreateNoticeDto) {
    const status = dto.status ?? NOTICE_STATUS_DRAFT;
    const publishScope = this.resolvePublishScope(
      dto.publishScope,
      dto.targetDepartmentIds,
      dto.targetRoleCodes
    );
    const notice = await this.prisma.notice.create({
      data: this.tenantScope.buildRequiredData({
        title: dto.title,
        content: dto.content,
        type: dto.type,
        status,
        publishScope,
        targetDepartmentIds: this.serializeDepartmentIds(
          dto.targetDepartmentIds,
          publishScope
        ),
        targetRoleCodes: this.serializeRoleCodes(
          dto.targetRoleCodes,
          publishScope
        ),
        isPinned: dto.isPinned ?? false,
        publisher: dto.publisher ?? null,
        scheduledPublishAt: this.toDate(dto.scheduledPublishAt),
        publishedAt: this.resolvePublishedAt({
          status,
          publishedAt: dto.publishedAt,
          scheduledPublishAt: dto.scheduledPublishAt
        }),
        eventKey: dto.eventKey ?? null,
        eventPayload: this.serializeEventPayload(dto.eventPayload)
      })
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async update(id: string, dto: UpdateNoticeDto) {
    const existing = await this.ensureNoticeExists(id);
    const nextStatus = dto.status ?? existing.status;
    const nextScope = this.resolvePublishScope(
      dto.publishScope ?? (existing.publishScope as NoticePublishScope),
      dto.targetDepartmentIds === undefined
        ? this.parseDelimitedNumberList(existing.targetDepartmentIds)
        : dto.targetDepartmentIds,
      dto.targetRoleCodes === undefined
        ? this.parseDelimitedStringList(existing.targetRoleCodes)
        : dto.targetRoleCodes
    );

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        status: dto.status,
        publishScope: dto.publishScope,
        targetDepartmentIds:
          dto.targetDepartmentIds === undefined
            ? undefined
            : this.serializeDepartmentIds(dto.targetDepartmentIds, nextScope),
        targetRoleCodes:
          dto.targetRoleCodes === undefined
            ? undefined
            : this.serializeRoleCodes(dto.targetRoleCodes, nextScope),
        isPinned: dto.isPinned,
        publisher: dto.publisher,
        scheduledPublishAt:
          dto.scheduledPublishAt === undefined
            ? undefined
            : this.toDate(dto.scheduledPublishAt),
        publishedAt: this.resolveUpdatedPublishedAt(existing, dto, nextStatus),
        eventKey: dto.eventKey,
        eventPayload:
          dto.eventPayload === undefined
            ? undefined
            : this.serializeEventPayload(dto.eventPayload)
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async publish(id: string, dto: PublishNoticeDto) {
    await this.ensureNoticeExists(id);

    const publishedAt = this.resolvePublishedAt({
      status: NOTICE_STATUS_PUBLISHED,
      publishedAt: dto.publishedAt,
      scheduledPublishAt: dto.scheduledPublishAt
    });
    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        status: NOTICE_STATUS_PUBLISHED,
        publisher: dto.publisher ?? undefined,
        scheduledPublishAt:
          dto.scheduledPublishAt === undefined
            ? undefined
            : this.toDate(dto.scheduledPublishAt),
        publishedAt
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async revoke(id: string) {
    await this.ensureNoticeExists(id);

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        status: NOTICE_STATUS_DRAFT,
        publishedAt: null
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async pin(id: string, dto: PinNoticeDto) {
    await this.ensureNoticeExists(id);

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        isPinned: dto.pinned
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async remove(id: string) {
    await this.ensureNoticeExists(id);
    await this.prisma.notice.delete({ where: { id } });
    return successResponse(true);
  }

  async listVisibleForUser(
    user: {
      sub: string;
      tenantId: string;
    },
    limit: number
  ) {
    const profile = await this.loadVisibilityProfile(user.sub);
    const now = new Date();

    const published = await this.prisma.notice.findMany({
      where: this.buildNoticeWhere({
        AND: [
          {
            status: true
          },
          {
            publishedAt: {
              lte: now
            }
          },
          this.buildVisibilityWhere(profile)
        ]
      }),
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    if (published.length) {
      return published.map((item) => this.toNoticeResponse(item));
    }

    const latest = await this.prisma.notice.findMany({
      where: this.buildNoticeWhere(this.buildVisibilityWhere(profile)),
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return latest.map((item) => this.toNoticeResponse(item));
  }

  private async ensureNoticeExists(id: string) {
    const notice = await this.prisma.notice.findFirst({
      where: this.buildNoticeWhere({ id })
    });
    if (!notice) {
      throw new BusinessException(BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND);
    }
    return notice;
  }

  private buildListOrderBy(query: NoticeListQueryDto): Prisma.NoticeOrderByWithRelationInput[] {
    const sortOrder = resolveSortOrder(query.sortOrder);

    switch (query.sortBy) {
      case 'title':
        return [{ title: sortOrder }, { createdAt: 'desc' }];
      case 'type':
        return [{ type: sortOrder }, { createdAt: 'desc' }];
      case 'status':
        return [{ status: sortOrder }, { createdAt: 'desc' }];
      case 'publishScope':
        return [{ publishScope: sortOrder }, { createdAt: 'desc' }];
      case 'isPinned':
        return [{ isPinned: sortOrder }, { createdAt: 'desc' }];
      case 'publishedAt':
        return [{ publishedAt: sortOrder }, { createdAt: 'desc' }];
      case 'scheduledPublishAt':
        return [{ scheduledPublishAt: sortOrder }, { createdAt: 'desc' }];
      case 'updatedAt':
        return [{ updatedAt: sortOrder }, { createdAt: 'desc' }];
      case 'createdAt':
        return [{ createdAt: sortOrder }];
      default:
        return [
          { isPinned: 'desc' },
          { publishedAt: 'desc' },
          { scheduledPublishAt: 'asc' },
          { createdAt: 'desc' }
        ];
    }
  }

  private async loadVisibilityProfile(userId: string): Promise<NoticeVisibilityProfile> {
    const user = await this.prisma.user.findFirst({
      where: this.tenantScope.buildRequiredWhere(
        { id: userId },
        'tenantId'
      ) as Prisma.UserWhereInput,
      select: {
        departmentId: true,
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

    return {
      departmentId: user?.departmentId ?? null,
      roleCodes:
        user?.roles
          .map((item) => item.role)
          .filter((item) => item.status)
          .map((item) => item.code) ?? []
    };
  }

  private buildNoticeWhere(where: Prisma.NoticeWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.NoticeWhereInput;
  }

  private buildVisibilityWhere(profile: NoticeVisibilityProfile): Prisma.NoticeWhereInput {
    const or: Prisma.NoticeWhereInput[] = [
      {
        publishScope: NOTICE_PUBLISH_SCOPE_TENANT_ALL
      }
    ];

    if (profile.departmentId !== null) {
      or.push({
        publishScope: NOTICE_PUBLISH_SCOPE_DEPARTMENT,
        targetDepartmentIds: {
          contains: `|${profile.departmentId}|`
        }
      });
    }

    profile.roleCodes.forEach((roleCode) => {
      or.push({
        publishScope: NOTICE_PUBLISH_SCOPE_ROLE,
        targetRoleCodes: {
          contains: `|${roleCode}|`
        }
      });
    });

    return {
      OR: or
    };
  }

  private resolvePublishedAt(options: {
    status: boolean;
    publishedAt?: string | null;
    scheduledPublishAt?: string | null;
  }) {
    if (!options.status) {
      return null;
    }

    if (options.scheduledPublishAt) {
      return new Date(options.scheduledPublishAt);
    }

    if (options.publishedAt) {
      return new Date(options.publishedAt);
    }

    return new Date();
  }

  private resolveUpdatedPublishedAt(
    existing: {
      status: boolean;
      publishedAt: Date | null;
      scheduledPublishAt: Date | null;
    },
    dto: UpdateNoticeDto,
    nextStatus: boolean
  ) {
    if (!nextStatus) {
      return null;
    }

    const nextScheduled =
      dto.scheduledPublishAt === undefined
        ? existing.scheduledPublishAt
        : this.toDate(dto.scheduledPublishAt);

    if (nextScheduled) {
      return nextScheduled;
    }

    if (dto.publishedAt === undefined) {
      return existing.publishedAt ?? new Date();
    }

    return this.toDate(dto.publishedAt) ?? new Date();
  }

  private serializeDepartmentIds(
    departmentIds: number[] | null | undefined,
    publishScope: NoticePublishScope | undefined
  ) {
    if (publishScope !== NOTICE_PUBLISH_SCOPE_DEPARTMENT || !departmentIds?.length) {
      return null;
    }

    return this.serializeDelimitedList(
      departmentIds.map((item) => String(item))
    );
  }

  private serializeRoleCodes(
    roleCodes: string[] | null | undefined,
    publishScope: NoticePublishScope | undefined
  ) {
    if (publishScope !== NOTICE_PUBLISH_SCOPE_ROLE || !roleCodes?.length) {
      return null;
    }

    return this.serializeDelimitedList(roleCodes);
  }

  private serializeDelimitedList(items: string[]) {
    const values = Array.from(
      new Set(items.map((item) => item.trim()).filter(Boolean))
    );
    if (!values.length) {
      return null;
    }

    return `|${values.join('|')}|`;
  }

  private parseDelimitedNumberList(value: string | null) {
    if (!value) {
      return [];
    }

    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item));
  }

  private parseDelimitedStringList(value: string | null) {
    if (!value) {
      return [];
    }

    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private serializeEventPayload(payload: Record<string, unknown> | null | undefined) {
    if (payload === undefined) {
      return undefined;
    }

    if (payload === null) {
      return null;
    }

    return JSON.stringify(payload);
  }

  private parseEventPayload(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {
        raw: value
      };
    }
  }

  private toDate(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    return new Date(value);
  }

  private resolvePublishScope(
    publishScope: NoticePublishScope | undefined,
    departmentIds?: number[] | null,
    roleCodes?: string[] | null
  ) {
    const scope = publishScope ?? NOTICE_PUBLISH_SCOPE_TENANT_ALL;

    if (
      scope === NOTICE_PUBLISH_SCOPE_DEPARTMENT &&
      departmentIds &&
      departmentIds.length > 0
    ) {
      return scope;
    }

    if (
      scope === NOTICE_PUBLISH_SCOPE_ROLE &&
      roleCodes &&
      roleCodes.length > 0
    ) {
      return scope;
    }

    return NOTICE_PUBLISH_SCOPE_TENANT_ALL;
  }

  private toNoticeResponse(notice: {
    id: string;
    tenantId: string;
    title: string;
    content: string;
    type: string;
    status: boolean;
    publishScope: string;
    targetDepartmentIds: string | null;
    targetRoleCodes: string | null;
    isPinned: boolean;
    publisher: string | null;
    scheduledPublishAt: Date | null;
    publishedAt: Date | null;
    eventKey: string | null;
    eventPayload: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: notice.id,
      tenantId: notice.tenantId,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      status: notice.status,
      publishScope: notice.publishScope,
      targetDepartmentIds: this.parseDelimitedNumberList(
        notice.targetDepartmentIds
      ),
      targetRoleCodes: this.parseDelimitedStringList(notice.targetRoleCodes),
      isPinned: notice.isPinned,
      publisher: notice.publisher,
      scheduledPublishAt: notice.scheduledPublishAt,
      publishedAt: notice.publishedAt,
      eventKey: notice.eventKey,
      eventPayload: this.parseEventPayload(notice.eventPayload),
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt
    };
  }
}
