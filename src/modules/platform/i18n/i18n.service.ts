import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { I18nResourcePullQueryDto } from './i18n.dto';

@Injectable()
export class I18nService {
  constructor(private readonly prisma: PrismaService) {}

  async pullResources(query: I18nResourcePullQueryDto) {
    const languageCode = query.languageCode.trim();
    const module = query.module?.trim();
    const updatedAfter = query.updatedAfter
      ? new Date(query.updatedAfter)
      : undefined;

    const filters: Prisma.I18nResourceWhereInput[] = [
      { languageCode },
      { status: true }
    ];

    if (module) {
      filters.push({ module });
    }

    if (updatedAfter) {
      filters.push({
        updatedAt: {
          gt: updatedAfter
        }
      });
    }

    const where =
      filters.length === 1 ? filters[0] : { AND: filters };

    const records = await this.prisma.i18nResource.findMany({
      where,
      orderBy: [
        { module: 'asc' },
        { resourceGroup: 'asc' },
        { resourceKey: 'asc' }
      ]
    });

    const latestVersion = records.reduce(
      (max, item) => Math.max(max, item.version),
      0
    );
    const latestUpdatedAt =
      records.length === 0
        ? null
        : records.reduce((latest, item) =>
            item.updatedAt > latest ? item.updatedAt : latest
          , records[0].updatedAt);

    return successResponse({
      languageCode,
      module: module ?? null,
      version: latestVersion,
      updatedAt: latestUpdatedAt,
      records: records.map((item) => ({
        id: item.id,
        languageCode: item.languageCode,
        module: item.module,
        resourceGroup: item.resourceGroup,
        resourceKey: item.resourceKey,
        resourceValue: item.resourceValue,
        version: item.version,
        status: item.status,
        updatedAt: item.updatedAt
      }))
    });
  }
}
