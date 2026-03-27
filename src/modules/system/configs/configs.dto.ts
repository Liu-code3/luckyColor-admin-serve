import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import {
  LIST_SORT_ORDER_VALUES,
  type ListSortOrder
} from '../../../shared/api/list-query.util';

const CONFIG_LIST_SORT_FIELDS = [
  'configGroup',
  'configKey',
  'configName',
  'status',
  'updatedAt',
  'createdAt'
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

  return undefined;
}

export class ConfigListQueryDto {
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
    description: '配置名称或配置键关键字',
    example: '语言'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '配置分组',
    example: 'appearance'
  })
  @IsOptional()
  @IsString()
  configGroup?: string;

  @ApiPropertyOptional({
    description: '配置状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: CONFIG_LIST_SORT_FIELDS,
    example: 'configKey'
  })
  @IsOptional()
  @IsIn(CONFIG_LIST_SORT_FIELDS)
  sortBy?: (typeof CONFIG_LIST_SORT_FIELDS)[number];

  @ApiPropertyOptional({
    description: '排序方向',
    enum: LIST_SORT_ORDER_VALUES,
    example: 'asc',
    default: 'asc'
  })
  @IsOptional()
  @IsIn(LIST_SORT_ORDER_VALUES)
  sortOrder?: ListSortOrder;
}

export class ConfigBatchQueryDto {
  @ApiPropertyOptional({
    description: '配置键列表，支持逗号分隔',
    type: [String],
    example: ['sys.default_locale', 'sys.enable_watermark']
  })
  @IsOptional()
  @Transform(({ value }) => transformStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  keys?: string[];
}

export class CreateConfigDto {
  @ApiProperty({
    description: '配置键',
    example: 'sys.default_locale'
  })
  @IsString()
  @IsNotEmpty()
  configKey!: string;

  @ApiProperty({
    description: '配置名称',
    example: '默认语言'
  })
  @IsString()
  @IsNotEmpty()
  configName!: string;

  @ApiProperty({
    description: '配置值',
    example: 'zh-CN'
  })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({
    description: '配置分组',
    example: 'appearance',
    default: 'default'
  })
  @IsOptional()
  @IsString()
  configGroup?: string;

  @ApiPropertyOptional({
    description: '值类型',
    example: 'string',
    default: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: '是否内置配置',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isBuiltIn?: boolean;

  @ApiPropertyOptional({
    description: '是否敏感配置',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isSensitive?: boolean;

  @ApiPropertyOptional({
    description: '状态，true 为启用，false 为停用',
    example: true,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '系统默认语言'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({
    description: '配置键',
    example: 'sys.default_locale'
  })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({
    description: '配置名称',
    example: '默认语言'
  })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({
    description: '配置值',
    example: 'en-US'
  })
  @IsOptional()
  @IsString()
  configValue?: string;

  @ApiPropertyOptional({
    description: '配置分组',
    example: 'appearance'
  })
  @IsOptional()
  @IsString()
  configGroup?: string;

  @ApiPropertyOptional({
    description: '值类型',
    example: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: '是否内置配置',
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isBuiltIn?: boolean;

  @ApiPropertyOptional({
    description: '是否敏感配置',
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isSensitive?: boolean;

  @ApiPropertyOptional({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '已更新语言配置'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
