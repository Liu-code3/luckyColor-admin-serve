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
import { SYSTEM_PERMISSION_POINTS } from '../../iam/permissions/permission-point-codes';
import {
  RequireMenuPermission,
  RequirePermissions
} from '../../iam/permissions/require-permissions.decorator';
import {
  CreateNoticeDto,
  NoticeListQueryDto,
  PinNoticeDto,
  PublishNoticeDto,
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
    summary: '通知公告分页列表',
    description:
      '按标题关键字、类型、状态和发布范围分页查询通知公告。'
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
    example: '发布',
    description: '公告标题关键字'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    example: 'release',
    description: '公告类型'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '发布状态'
  })
  @ApiQuery({
    name: 'publishScope',
    required: false,
    example: 'ROLE',
    description: '公告发布范围'
  })
  @ApiSuccessResponse({
    type: NoticePageResponseDto,
    description: '通知公告分页结果',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'notice_1',
          tenantId: 'tenant_001',
          title: '版本发布提醒',
          content: '请在新版本上线前完成角色权限复核。',
          type: 'release',
          status: false,
          publishScope: 'ROLE',
          targetDepartmentIds: [],
          targetRoleCodes: ['tenant_admin'],
          isPinned: false,
          publisher: '产品团队',
          scheduledPublishAt: '2026-03-28T08:00:00.000Z',
          publishedAt: null,
          eventKey: 'release.reminder',
          eventPayload: { channel: 'dashboard' },
          createdAt: '2026-03-22T14:30:00.000Z',
          updatedAt: '2026-03-22T14:30:00.000Z'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '分页查询参数校验失败',
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
    summary: '通知公告详情',
    description: '根据公告 ID 查询详情。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '通知公告详情',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '请在新版本上线前完成角色权限复核。',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: false,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
    summary: '创建通知公告',
    description: '创建带有发布范围、发布时间和扩展事件字段的通知公告。'
  })
  @ApiBody({ type: CreateNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '创建后的通知公告',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '请在新版本上线前完成角色权限复核。',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: false,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
    module: 'Notice',
    action: 'Create notice',
    targets: [{ source: 'body', key: 'title', label: 'title' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.create)
  @Post()
  create(@Body() dto: CreateNoticeDto) {
    return this.noticesService.create(dto);
  }

  @ApiOperation({
    summary: '更新通知公告',
    description: '更新通知公告内容、发布范围、发布时间和事件字段。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiBody({ type: UpdateNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '更新后的通知公告',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '已更新公告内容。',
      type: 'release',
      status: true,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: true,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: '2026-03-28T08:00:00.000Z',
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
    module: 'Notice',
    action: 'Update notice',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'title', label: 'title' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.update)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoticeDto) {
    return this.noticesService.update(id, dto);
  }

  @ApiOperation({
    summary: '发布通知公告',
    description: '立即发布或定时发布公告。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiBody({ type: PublishNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '发布后的通知公告',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '请在新版本上线前完成角色权限复核。',
      type: 'release',
      status: true,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: false,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: '2026-03-28T08:00:00.000Z',
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
  @SystemLog({
    module: 'Notice',
    action: 'Publish notice',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.update)
  @Patch(':id/publish')
  publish(@Param('id') id: string, @Body() dto: PublishNoticeDto) {
    return this.noticesService.publish(id, dto);
  }

  @ApiOperation({
    summary: '撤回通知公告',
    description: '撤回已发布的通知公告。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '撤回后的通知公告',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '请在新版本上线前完成角色权限复核。',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: false,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
  @SystemLog({
    module: 'Notice',
    action: 'Revoke notice',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.update)
  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.noticesService.revoke(id);
  }

  @ApiOperation({
    summary: '置顶通知公告',
    description: '设置或取消公告置顶。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiBody({ type: PinNoticeDto })
  @ApiSuccessResponse({
    type: NoticeItemResponseDto,
    description: '置顶后的通知公告',
    dataExample: {
      id: 'notice_1',
      tenantId: 'tenant_001',
      title: '版本发布提醒',
      content: '请在新版本上线前完成角色权限复核。',
      type: 'release',
      status: false,
      publishScope: 'ROLE',
      targetDepartmentIds: [],
      targetRoleCodes: ['tenant_admin'],
      isPinned: true,
      publisher: '产品团队',
      scheduledPublishAt: '2026-03-28T08:00:00.000Z',
      publishedAt: null,
      eventKey: 'release.reminder',
      eventPayload: { channel: 'dashboard' },
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
  @SystemLog({
    module: 'Notice',
    action: 'Pin notice',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.update)
  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body() dto: PinNoticeDto) {
    return this.noticesService.pin(id, dto);
  }

  @ApiOperation({
    summary: '删除通知公告',
    description: '根据公告 ID 删除通知公告。'
  })
  @ApiParam({
    name: 'id',
    description: '公告 ID',
    example: 'notice_1'
  })
  @ApiSuccessResponse({
    description: '删除结果',
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
    module: 'Notice',
    action: 'Delete notice',
    targets: [{ source: 'param', key: 'id', label: 'id' }],
    sensitive: true
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.notice.delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
