import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardUserSummaryDto {
  @ApiProperty({
    description: 'user id',
    example: 'clxuser1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'username',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: 'nickname',
    example: '系统管理员',
    nullable: true
  })
  nickname?: string | null;
}

export class DashboardStatsResponseDto {
  @ApiProperty({
    description: 'online users within active window',
    example: 3
  })
  onlineUsers!: number;

  @ApiProperty({
    description: 'today unique visitors',
    example: 18
  })
  visitorUv!: number;

  @ApiProperty({
    description: 'today page views',
    example: 42
  })
  pageViews!: number;

  @ApiProperty({
    description: 'active window in seconds',
    example: 300
  })
  onlineWindowSeconds!: number;
}

export class DashboardTrendItemResponseDto {
  @ApiProperty({
    description: 'date key',
    example: '2026-03-23'
  })
  date!: string;

  @ApiProperty({
    description: 'page views',
    example: 12
  })
  pv!: number;

  @ApiProperty({
    description: 'unique visitors',
    example: 7
  })
  uv!: number;
}

export class DashboardRecentVisitItemResponseDto {
  @ApiProperty({
    description: 'route path',
    example: '/systemManagement/system/users'
  })
  routePath!: string;

  @ApiProperty({
    description: 'route title',
    example: '用户管理'
  })
  routeTitle!: string;

  @ApiPropertyOptional({
    description: 'route icon',
    example: 'solar:users-group-rounded-linear',
    nullable: true
  })
  routeIcon?: string | null;

  @ApiProperty({
    description: 'last visited time',
    format: 'date-time',
    example: '2026-03-23T01:00:00.000Z'
  })
  lastVisitedAt!: string;
}

export class DashboardNoticeItemResponseDto {
  @ApiProperty({
    description: 'notice id',
    example: 'clxnotice1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'notice title',
    example: '租户开通通知'
  })
  title!: string;

  @ApiProperty({
    description: 'notice content',
    example: '本周已完成默认租户的基础能力初始化。'
  })
  content!: string;

  @ApiProperty({
    description: 'notice type',
    example: 'NOTICE'
  })
  type!: string;

  @ApiProperty({
    description: 'publish status',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: 'publisher',
    example: '系统发布',
    nullable: true
  })
  publisher?: string | null;

  @ApiPropertyOptional({
    description: 'published at',
    format: 'date-time',
    example: '2026-03-23T01:00:00.000Z',
    nullable: true
  })
  publishedAt?: string | null;

  @ApiProperty({
    description: 'created at',
    format: 'date-time',
    example: '2026-03-23T01:00:00.000Z'
  })
  createdAt!: string;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({
    description: 'current user summary',
    type: DashboardUserSummaryDto
  })
  user!: DashboardUserSummaryDto;

  @ApiProperty({
    description: 'dashboard stats',
    type: DashboardStatsResponseDto
  })
  stats!: DashboardStatsResponseDto;

  @ApiProperty({
    description: 'trend data',
    type: [DashboardTrendItemResponseDto]
  })
  trend!: DashboardTrendItemResponseDto[];

  @ApiProperty({
    description: 'recent visits for current user',
    type: [DashboardRecentVisitItemResponseDto]
  })
  recentVisits!: DashboardRecentVisitItemResponseDto[];

  @ApiProperty({
    description: 'latest notices',
    type: [DashboardNoticeItemResponseDto]
  })
  notices!: DashboardNoticeItemResponseDto[];
}

export class DashboardVisitTrackedResponseDto {
  @ApiProperty({
    description: 'tracked visit id',
    example: 'clxvisit1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'tracked at',
    format: 'date-time',
    example: '2026-03-23T01:00:00.000Z'
  })
  visitedAt!: string;
}
