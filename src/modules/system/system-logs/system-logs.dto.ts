import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Min } from 'class-validator';
import {
  LIST_SORT_ORDER_VALUES,
  type ListSortOrder
} from '../../../shared/api/list-query.util';

const SYSTEM_LOG_LIST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'module',
  'operatorName'
] as const;

export class SystemLogListQueryDto {
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
    description: '日志模块',
    example: '用户管理'
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: '操作人',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiPropertyOptional({
    description: '关键字，匹配日志内容',
    example: '删除用户'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'sort field',
    enum: SYSTEM_LOG_LIST_SORT_FIELDS,
    example: 'createdAt'
  })
  @IsOptional()
  @IsIn(SYSTEM_LOG_LIST_SORT_FIELDS)
  sortBy?: (typeof SYSTEM_LOG_LIST_SORT_FIELDS)[number];

  @ApiPropertyOptional({
    description: 'sort order',
    enum: LIST_SORT_ORDER_VALUES,
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsIn(LIST_SORT_ORDER_VALUES)
  sortOrder?: ListSortOrder;
}

export class CreateSystemLogDto {
  @ApiProperty({
    description: '日志模块',
    example: '用户管理'
  })
  @IsString()
  module!: string;

  @ApiProperty({
    description: '日志内容',
    example: '删除了用户 admin-test'
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: '地区，未传时默认记录为“未知”',
    example: '上海市'
  })
  @IsOptional()
  @IsString()
  region?: string;
}
