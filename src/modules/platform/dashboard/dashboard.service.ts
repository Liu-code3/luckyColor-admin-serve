import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { TrackDashboardVisitDto } from './dashboard.dto';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const TREND_DAYS = 30;
const RECENT_VISIT_LIMIT = 6;
const NOTICE_LIMIT = 4;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async overview(user: JwtPayload) {
    const now = new Date();
    const todayStart = this.getDayStart(now);
    const onlineThreshold = new Date(now.getTime() - ONLINE_WINDOW_MS);
    const trendStart = this.getDayStartOffset(now, TREND_DAYS - 1);

    const [currentUser, todayVisits, onlineVisits, trendVisits, recentVisitRows] =
      await this.prisma.$transaction([
        this.prisma.user.findFirst({
          where: this.buildUserWhere({ id: user.sub })
        }),
        this.prisma.dashboardVisit.findMany({
          where: this.buildDashboardVisitWhere({
            visitedAt: {
              gte: todayStart
            }
          }),
          select: {
            visitorId: true
          }
        }),
        this.prisma.dashboardVisit.findMany({
          where: this.buildDashboardVisitWhere({
            visitedAt: {
              gte: onlineThreshold
            }
          }),
          select: {
            sessionId: true
          }
        }),
        this.prisma.dashboardVisit.findMany({
          where: this.buildDashboardVisitWhere({
            visitedAt: {
              gte: trendStart
            }
          }),
          orderBy: {
            visitedAt: 'asc'
          },
          select: {
            visitorId: true,
            visitedAt: true
          }
        }),
        this.prisma.dashboardVisit.findMany({
          where: this.buildDashboardVisitWhere({
            userId: user.sub
          }),
          orderBy: {
            visitedAt: 'desc'
          },
          take: 30,
          select: {
            routePath: true,
            routeTitle: true,
            routeIcon: true,
            visitedAt: true
          }
        })
      ]);

    const notices = await this.loadDashboardNotices();

    const recentVisitMap = new Map<
      string,
      {
        routePath: string;
        routeTitle: string;
        routeIcon: string | null;
        lastVisitedAt: Date;
      }
    >();

    recentVisitRows.forEach((item) => {
      if (recentVisitMap.has(item.routePath)) {
        return;
      }

      recentVisitMap.set(item.routePath, {
        routePath: item.routePath,
        routeTitle: item.routeTitle,
        routeIcon: item.routeIcon,
        lastVisitedAt: item.visitedAt
      });
    });

    const recentVisits = Array.from(recentVisitMap.values()).slice(
      0,
      RECENT_VISIT_LIMIT
    );

    const trend = this.buildTrend(trendVisits, trendStart);

    return successResponse({
      user: {
        id: user.sub,
        username: user.username,
        nickname: currentUser?.nickname ?? null
      },
      stats: {
        onlineUsers: new Set(onlineVisits.map(item => item.sessionId)).size,
        visitorUv: new Set(todayVisits.map(item => item.visitorId)).size,
        pageViews: todayVisits.length,
        onlineWindowSeconds: ONLINE_WINDOW_MS / 1000
      },
      trend,
      recentVisits: recentVisits.map(item => ({
        ...item,
        lastVisitedAt: item.lastVisitedAt
      })),
      notices
    });
  }

  async trackVisit(user: JwtPayload, dto: TrackDashboardVisitDto) {
    const visit = await this.prisma.dashboardVisit.create({
      data: this.tenantScope.buildRequiredData({
        userId: user.sub,
        visitorId: dto.visitorId,
        sessionId: dto.sessionId,
        routePath: dto.routePath,
        routeTitle: dto.routeTitle,
        routeIcon: dto.routeIcon ?? null
      })
    });

    return successResponse({
      id: visit.id,
      visitedAt: visit.visitedAt
    });
  }

  private async loadDashboardNotices() {
    const published = await this.prisma.notice.findMany({
      where: this.buildNoticeWhere({ status: true }),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: NOTICE_LIMIT
    });

    if (published.length) {
      return published.map(item => this.toNoticeSummary(item));
    }

    const latest = await this.prisma.notice.findMany({
      where: this.buildNoticeWhere(),
      orderBy: {
        createdAt: 'desc'
      },
      take: NOTICE_LIMIT
    });

    return latest.map(item => this.toNoticeSummary(item));
  }

  private buildUserWhere(where: Prisma.UserWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.UserWhereInput;
  }

  private buildDashboardVisitWhere(where: Prisma.DashboardVisitWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.DashboardVisitWhereInput;
  }

  private buildNoticeWhere(where: Prisma.NoticeWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.NoticeWhereInput;
  }

  private buildTrend(
    visits: Array<{
      visitorId: string;
      visitedAt: Date;
    }>,
    trendStart: Date
  ) {
    const trendMap = new Map<string, { pv: number; visitors: Set<string> }>();

    for (let i = 0; i < TREND_DAYS; i += 1) {
      const current = new Date(trendStart);
      current.setDate(trendStart.getDate() + i);
      trendMap.set(this.toDateKey(current), {
        pv: 0,
        visitors: new Set<string>()
      });
    }

    visits.forEach((visit) => {
      const key = this.toDateKey(visit.visitedAt);
      const current = trendMap.get(key);
      if (!current) {
        return;
      }

      current.pv += 1;
      current.visitors.add(visit.visitorId);
    });

    return Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      pv: value.pv,
      uv: value.visitors.size
    }));
  }

  private toNoticeSummary(item: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: boolean;
    publisher: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type,
      status: item.status,
      publisher: item.publisher,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt
    };
  }

  private getDayStart(date: Date) {
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    return current;
  }

  private getDayStartOffset(date: Date, offsetDays: number) {
    const current = this.getDayStart(date);
    current.setDate(current.getDate() - offsetDays);
    return current;
  }

  private toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
