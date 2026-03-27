import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import {
  NOTICE_PUBLISH_SCOPE_VALUES,
  type NoticePublishScope
} from '../../../shared/constants/notice.constants';
import {
  NOTICE_STATUS_VALUES,
  type NoticeStatus
} from '../../../shared/constants/status.constants';
import {
  LIST_SORT_ORDER_VALUES,
  type ListSortOrder
} from '../../../shared/api/list-query.util';

const NOTICE_LIST_SORT_FIELDS = [
  'isPinned',
  'publishedAt',
  'scheduledPublishAt',
  'createdAt',
  'updatedAt',
  'title',
  'type',
  'status',
  'publishScope'
] as const;

function transformBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

function transformStringArray(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

function transformNumberArray(value: unknown) {
  const result = transformStringArray(value);
  if (!Array.isArray(result)) {
    return result;
  }

  return result.map((item) => Number(item)).filter((item) => Number.isInteger(item));
}

export class NoticeListQueryDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    default: 1
  })
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: '每页条数',
    example: 10,
    default: 10
  })
  @Type(() => Number)
  @Min(1)
  size = 10;

  @ApiPropertyOptional({
    description: '公告标题关键字',
    example: '发布'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '公告类型',
    example: 'release'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: '发布状态',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  @IsIn(NOTICE_STATUS_VALUES)
  status?: NoticeStatus;

  @ApiPropertyOptional({
    description: '公告发布范围',
    example: 'ROLE'
  })
  @IsOptional()
  @IsString()
  @IsIn(NOTICE_PUBLISH_SCOPE_VALUES)
  publishScope?: NoticePublishScope;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: NOTICE_LIST_SORT_FIELDS,
    example: 'publishedAt'
  })
  @IsOptional()
  @IsIn(NOTICE_LIST_SORT_FIELDS)
  sortBy?: (typeof NOTICE_LIST_SORT_FIELDS)[number];

  @ApiPropertyOptional({
    description: '排序方向',
    enum: LIST_SORT_ORDER_VALUES,
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsIn(LIST_SORT_ORDER_VALUES)
  sortOrder?: ListSortOrder;
}

export class CreateNoticeDto {
  @ApiProperty({
    description: '公告标题',
    example: '版本发布提醒'
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: '公告内容',
    example: '请在新版本上线前完成角色权限复核。'
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: '公告类型',
    example: 'release'
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    description: '发布状态',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  @IsIn(NOTICE_STATUS_VALUES)
  status?: NoticeStatus;

  @ApiPropertyOptional({
    description: '发布范围',
    example: 'TENANT_ALL',
    default: 'TENANT_ALL'
  })
  @IsOptional()
  @IsString()
  @IsIn(NOTICE_PUBLISH_SCOPE_VALUES)
  publishScope?: NoticePublishScope;

  @ApiPropertyOptional({
    description: '当发布范围为部门时的目标部门 ID 列表',
    type: [Number],
    example: [100, 120]
  })
  @IsOptional()
  @Transform(({ value }) => transformNumberArray(value))
  @IsArray()
  @ArrayUnique()
  targetDepartmentIds?: number[];

  @ApiPropertyOptional({
    description: '当发布范围为角色时的目标角色编码列表',
    type: [String],
    example: ['tenant_admin']
  })
  @IsOptional()
  @Transform(({ value }) => transformStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  targetRoleCodes?: string[];

  @ApiPropertyOptional({
    description: '是否置顶',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队'
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: '计划发布时间',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  scheduledPublishAt?: string | null;

  @ApiPropertyOptional({
    description: '实际发布时间',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  publishedAt?: string | null;

  @ApiPropertyOptional({
    description: '预留的事件键',
    example: 'release.reminder'
  })
  @IsOptional()
  @IsString()
  eventKey?: string;

  @ApiPropertyOptional({
    description: '预留的事件载荷',
    example: { channel: 'dashboard' }
  })
  @IsOptional()
  @IsObject()
  eventPayload?: Record<string, unknown> | null;
}

export class UpdateNoticeDto {
  @ApiPropertyOptional({
    description: '公告标题',
    example: '版本发布提醒'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '公告内容',
    example: '请在新版本上线前完成角色权限复核。'
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '公告类型',
    example: 'release'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: '发布状态',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  @IsIn(NOTICE_STATUS_VALUES)
  status?: NoticeStatus;

  @ApiPropertyOptional({
    description: '发布范围',
    example: 'ROLE'
  })
  @IsOptional()
  @IsString()
  @IsIn(NOTICE_PUBLISH_SCOPE_VALUES)
  publishScope?: NoticePublishScope;

  @ApiPropertyOptional({
    description: '当发布范围为部门时的目标部门 ID 列表',
    type: [Number],
    example: [100, 120]
  })
  @IsOptional()
  @Transform(({ value }) => transformNumberArray(value))
  @IsArray()
  @ArrayUnique()
  targetDepartmentIds?: number[] | null;

  @ApiPropertyOptional({
    description: '当发布范围为角色时的目标角色编码列表',
    type: [String],
    example: ['tenant_admin']
  })
  @IsOptional()
  @Transform(({ value }) => transformStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  targetRoleCodes?: string[] | null;

  @ApiPropertyOptional({
    description: '是否置顶',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队'
  })
  @IsOptional()
  @IsString()
  publisher?: string | null;

  @ApiPropertyOptional({
    description: '计划发布时间',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  scheduledPublishAt?: string | null;

  @ApiPropertyOptional({
    description: '实际发布时间',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  publishedAt?: string | null;

  @ApiPropertyOptional({
    description: '预留的事件键',
    example: 'release.reminder'
  })
  @IsOptional()
  @IsString()
  eventKey?: string | null;

  @ApiPropertyOptional({
    description: '预留的事件载荷',
    example: { channel: 'dashboard' }
  })
  @IsOptional()
  @IsObject()
  eventPayload?: Record<string, unknown> | null;
}

export class PublishNoticeDto {
  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队'
  })
  @IsOptional()
  @IsString()
  publisher?: string | null;

  @ApiPropertyOptional({
    description: '计划发布时间',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  scheduledPublishAt?: string | null;

  @ApiPropertyOptional({
    description: '发布时间覆盖值',
    example: '2026-03-28T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  publishedAt?: string | null;
}

export class PinNoticeDto {
  @ApiProperty({
    description: '是否置顶',
    example: true
  })
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  pinned!: boolean;
}
