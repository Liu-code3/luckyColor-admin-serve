import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  CreateNoticeDto,
  NoticeListQueryDto,
  UpdateNoticeDto
} from './notices.dto';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: NoticeListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          title: { contains: keyword }
        }
      : {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
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
      records: records.map((item) => this.toNoticeResponse(item))
    });
  }

  async detail(id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      throw new BusinessException(BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND);
    }

    return successResponse(this.toNoticeResponse(notice));
  }

  async create(dto: CreateNoticeDto) {
    const isPublished = dto.status ?? false;
    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        status: isPublished,
        publisher: dto.publisher ?? null,
        publishedAt: this.resolvePublishedAt(dto.publishedAt, isPublished)
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async update(id: string, dto: UpdateNoticeDto) {
    const existing = await this.ensureNoticeExists(id);
    const nextStatus = dto.status ?? existing.status;
    const publishedAt =
      dto.publishedAt === undefined
        ? existing.publishedAt ?? (nextStatus ? new Date() : null)
        : this.resolvePublishedAt(dto.publishedAt, nextStatus);

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        status: dto.status,
        publisher: dto.publisher,
        publishedAt
      }
    });

    return successResponse(this.toNoticeResponse(notice));
  }

  async remove(id: string) {
    await this.ensureNoticeExists(id);
    await this.prisma.notice.delete({ where: { id } });
    return successResponse(true);
  }

  private async ensureNoticeExists(id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      throw new BusinessException(BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND);
    }
    return notice;
  }

  private resolvePublishedAt(
    publishedAt: string | null | undefined,
    status: boolean
  ) {
    if (!status) {
      return null;
    }

    if (!publishedAt) {
      return new Date();
    }

    return new Date(publishedAt);
  }

  private toNoticeResponse(notice: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: boolean;
    publisher: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      status: notice.status,
      publisher: notice.publisher,
      publishedAt: notice.publishedAt,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt
    };
  }
}
