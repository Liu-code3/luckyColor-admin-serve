import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { CurrentUser } from '../../iam/auth/current-user.decorator';
import { JwtAuthGuard } from '../../iam/auth/jwt-auth.guard';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { TrackDashboardVisitDto } from './dashboard.dto';
import {
  DashboardOverviewResponseDto,
  DashboardVisitTrackedResponseDto
} from './dashboard.response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('平台能力 / 工作台')
@ApiServerErrorResponse()
@ApiUnauthorizedErrorResponse()
@ApiForbiddenErrorResponse({
  description: '当前登录态不可访问',
  examples: [
    {
      name: 'roleDisabled',
      code: BUSINESS_ERROR_CODES.ROLE_DISABLED,
      summary: '当前账号角色已失效'
    },
    {
      name: 'tenantDisabled',
      code: BUSINESS_ERROR_CODES.TENANT_DISABLED,
      summary: '当前租户已被禁用'
    },
    {
      name: 'tenantExpired',
      code: BUSINESS_ERROR_CODES.TENANT_EXPIRED,
      summary: '当前租户已过期'
    },
    {
      name: 'tenantFrozen',
      code: BUSINESS_ERROR_CODES.TENANT_FROZEN,
      summary: '当前租户已被冻结'
    },
    {
      name: 'tenantAccessDenied',
      code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED,
      summary: '当前账号不能访问该租户'
    }
  ]
})
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: '获取首页工作台概览',
    description:
      '返回用户卡片、在线人数、访问趋势、最近访问和通知公告等首页所需数据。'
  })
  @ApiSuccessResponse({
    type: DashboardOverviewResponseDto,
    description: '工作台概览',
    dataExample: {
      user: {
        id: 'clxuser1234567890',
        username: 'admin',
        nickname: '系统管理员'
      },
      stats: {
        onlineUsers: 2,
        visitorUv: 12,
        pageViews: 30,
        onlineWindowSeconds: 300
      },
      trend: [
        {
          date: '2026-03-17',
          pv: 5,
          uv: 3
        }
      ],
      recentVisits: [
        {
          routePath: '/systemManagement/system/users',
          routeTitle: '用户管理',
          routeIcon: 'solar:users-group-rounded-linear',
          lastVisitedAt: '2026-03-23T01:00:00.000Z'
        }
      ],
      notices: [
        {
          id: 'clxnotice1234567890',
          title: '租户开通通知',
          content: '本周已完成默认租户初始化。',
          type: 'NOTICE',
          status: true,
          publisher: '系统发布',
          publishedAt: '2026-03-23T01:00:00.000Z',
          createdAt: '2026-03-23T00:00:00.000Z'
        }
      ]
    }
  })
  @Get('overview')
  overview(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.overview(user);
  }

  @ApiOperation({
    summary: '记录页面访问事件',
    description:
      '工作台通过该接口上报路由访问和会话心跳，用于在线人数、PV、UV、最近访问等统计。'
  })
  @ApiBody({
    type: TrackDashboardVisitDto
  })
  @ApiSuccessResponse({
    type: DashboardVisitTrackedResponseDto,
    description: '访问事件记录成功',
    dataExample: {
      id: 'clxvisit1234567890',
      visitedAt: '2026-03-23T01:00:00.000Z'
    }
  })
  @Post('track-visit')
  trackVisit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TrackDashboardVisitDto
  ) {
    return this.dashboardService.trackVisit(user, dto);
  }
}
