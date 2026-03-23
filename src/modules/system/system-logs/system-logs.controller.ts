import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { CurrentUser } from '../../iam/auth/current-user.decorator';
import { JwtAuthGuard } from '../../iam/auth/jwt-auth.guard';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { CreateSystemLogDto, SystemLogListQueryDto } from './system-logs.dto';
import {
  SystemLogItemResponseDto,
  SystemLogPageResponseDto
} from './system-logs.response.dto';
import { SystemLogsService } from './system-logs.service';

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

@ApiTags('系统管理 / 系统日志')
@ApiServerErrorResponse()
@ApiUnauthorizedErrorResponse({
  description: '登录态异常响应',
  examples: [
    {
      name: 'tokenExpired',
      code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      summary: '登录已过期'
    },
    {
      name: 'tokenInvalid',
      code: BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID,
      summary: '登录状态无效'
    }
  ]
})
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
      name: 'tenantAccessDenied',
      code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED,
      summary: '当前账号不能访问该租户'
    }
  ]
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @ApiOperation({
    summary: '系统日志分页列表',
    description:
      '分页查询系统日志，支持按日志模块、操作人和日志内容关键字筛选。'
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'module',
    required: false,
    example: '用户管理',
    description: '日志模块'
  })
  @ApiQuery({
    name: 'operator',
    required: false,
    example: 'admin',
    description: '操作人'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: '删除用户',
    description: '日志内容关键字'
  })
  @ApiSuccessResponse({
    type: SystemLogPageResponseDto,
    description: '系统日志分页列表响应',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'clxsyslog1234567890',
          tenantId: 'tenant_001',
          operatorUserId: 'user_001',
          operatorName: 'admin',
          module: '用户管理',
          content: '删除了用户 admin-test',
          ipAddress: '127.0.0.1',
          region: '上海市',
          browserVersion: 'Chrome 123.0.0.0',
          terminalSystem: 'Windows',
          createdAt: '2026-03-23T03:30:00.000Z',
          updatedAt: '2026-03-23T03:30:00.000Z'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '分页参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get()
  list(@Query() query: SystemLogListQueryDto) {
    return this.systemLogsService.list(query);
  }

  @ApiOperation({
    summary: '系统日志详情',
    description: '根据系统日志 ID 查询详情。'
  })
  @ApiParam({
    name: 'id',
    description: '系统日志 ID',
    example: 'clxsyslog1234567890'
  })
  @ApiSuccessResponse({
    type: SystemLogItemResponseDto,
    description: '系统日志详情响应',
    dataExample: {
      id: 'clxsyslog1234567890',
      tenantId: 'tenant_001',
      operatorUserId: 'user_001',
      operatorName: 'admin',
      module: '用户管理',
      content: '删除了用户 admin-test',
      ipAddress: '127.0.0.1',
      region: '上海市',
      browserVersion: 'Chrome 123.0.0.0',
      terminalSystem: 'Windows',
      createdAt: '2026-03-23T03:30:00.000Z',
      updatedAt: '2026-03-23T03:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '系统日志不存在',
    examples: [
      {
        name: 'systemLogNotFound',
        code: BUSINESS_ERROR_CODES.SYSTEM_LOG_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.systemLogsService.detail(id);
  }

  @ApiOperation({
    summary: '创建系统日志',
    description:
      '创建一条系统日志，操作人从当前登录态提取，IP 地址与浏览器/终端系统从请求头自动解析。'
  })
  @ApiBody({
    type: CreateSystemLogDto
  })
  @ApiSuccessResponse({
    type: SystemLogItemResponseDto,
    description: '系统日志创建成功响应',
    dataExample: {
      id: 'clxsyslog1234567890',
      tenantId: 'tenant_001',
      operatorUserId: 'user_001',
      operatorName: 'admin',
      module: '用户管理',
      content: '删除了用户 admin-test',
      ipAddress: '127.0.0.1',
      region: '上海市',
      browserVersion: 'Chrome 123.0.0.0',
      terminalSystem: 'Windows',
      createdAt: '2026-03-23T03:30:00.000Z',
      updatedAt: '2026-03-23T03:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '创建参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSystemLogDto,
    @Req() request: RequestLike
  ) {
    return this.systemLogsService.create(user, dto, request);
  }
}
