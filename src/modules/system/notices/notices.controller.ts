import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { RequireMenuPermission } from '../../iam/permissions/require-permissions.decorator';
import {
  CreateNoticeDto,
  NoticeListQueryDto,
  UpdateNoticeDto
} from './notices.dto';
import {
  NoticeItemResponseDto,
  NoticePageResponseDto
} from './notices.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { NoticesService } from './notices.service';

@ApiTags('系统管理 / 通知公告')
@ApiServerErrorResponse()
@RequireMenuPermission('main_system_notice')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @ApiOperation({
    summary: '公告分页列表',
    description: '分页查询通知公告，支持标题关键字筛选。'
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: '更新',
    description: '公告标题关键字'
  })
  @ApiSuccessResponse({
    type: NoticePageResponseDto,
    description: '公告分页列表响应',
    dataExample: {
      total: 2,
      current: 1,
      size: 10,
      records: [
        {
          id: 'clxnotice1234567890',
          title: '版本更新提醒',
          content: '本周将上线多租户配置中心，请提前关注菜单与权限变更。',
          type: 'release',
          status: false,
          publisher: '产品团队',
          publishedAt: null,
          createdAt: '2026-03-22T14:30:00.000Z',
          updatedAt: '2026-03-22T14:30:00.000Z'
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
  list(@Query() query: NoticeListQueryDto) {
    return this.noticesService.list(query);
  }

  @ApiOperation({
    summary: '公告详情',
    description: '根据公告 ID 查询公告详情。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'clxnotice1234567890'
  })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '公告详情响应',
    dataExample: {
      id: 'clxnotice1234567890',
      title: '版本更新提醒',
      content: '本周将上线多租户配置中心，请提前关注菜单与权限变更。',
      type: 'release',
      status: false,
      publisher: '产品团队',
      publishedAt: null,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '通知公告不存在',
    examples: [
      {
        name: 'noticeNotFound',
        code: BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.noticesService.detail(id);
  }

  @ApiOperation({
    summary: '创建公告',
    description: '新增通知公告。'
  })
  @ApiBody({ type: CreateNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '公告创建成功响应',
    dataExample: {
      id: 'clxnotice1234567890',
      title: '版本更新提醒',
      content: '本周将上线多租户配置中心，请提前关注菜单与权限变更。',
      type: 'release',
      status: false,
      publisher: '产品团队',
      publishedAt: null,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
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
  @SystemLog({
    module: '通知公告',
    action: '创建公告',
    targets: [{ source: 'body', key: 'title', label: 'title' }]
  })
  @Post()
  create(@Body() dto: CreateNoticeDto) {
    return this.noticesService.create(dto);
  }

  @ApiOperation({
    summary: '更新公告',
    description: '根据公告 ID 更新通知公告。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'clxnotice1234567890'
  })
  @ApiBody({ type: UpdateNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '公告更新成功响应',
    dataExample: {
      id: 'clxnotice1234567890',
      title: '版本更新提醒',
      content: '更新后的公告内容',
      type: 'release',
      status: true,
      publisher: '产品团队',
      publishedAt: '2026-03-22T10:00:00.000Z',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '通知公告不存在',
    examples: [
      {
        name: 'noticeNotFound',
        code: BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '更新参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '通知公告',
    action: '更新公告',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'title', label: 'title' }
    ]
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除公告',
    description: '根据公告 ID 删除通知公告。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'clxnotice1234567890'
  })
  @ApiSuccessResponse({
    description: '公告删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '通知公告不存在',
    examples: [
      {
        name: 'noticeNotFound',
        code: BUSINESS_ERROR_CODES.NOTICE_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '通知公告',
    action: '删除公告',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
