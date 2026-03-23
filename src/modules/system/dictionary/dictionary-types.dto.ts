import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

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

export class DictionaryTypeListQueryDto {
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
    description: '字典类型名称、标签或编码关键字',
    example: '状态'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '字典分类',
    example: 'FRM'
  })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateDictionaryTypeDto {
  @ApiPropertyOptional({
    description: '字典类型 ID，不传则自动生成',
    example: 'dict_common_status'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: '字典类型名称',
    example: '系统通用状态'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: '字典类型标签，默认与类型名称一致',
    example: '系统通用状态'
  })
  @IsOptional()
  @IsString()
  dictLabel?: string;

  @ApiProperty({
    description: '字典类型编码',
    example: 'COMMON_STATUS'
  })
  @IsString()
  @IsNotEmpty()
  dictValue!: string;

  @ApiProperty({
    description: '字典分类',
    example: 'FRM'
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: '权重',
    example: 10
  })
  @Type(() => Number)
  @IsInt()
  weight!: number;

  @ApiProperty({
    description: '排序值',
    example: 100
  })
  @Type(() => Number)
  @IsInt()
  sortCode!: number;

  @ApiPropertyOptional({
    description: '状态，true 为启用，false 为停用',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '删除标记，默认 NOT_DELETE',
    example: 'NOT_DELETE',
    default: 'NOT_DELETE'
  })
  @IsOptional()
  @IsString()
  deleteFlag?: string;

  @ApiPropertyOptional({
    description: '租户 ID，租户上下文存在时以后端上下文为准',
    example: 'tenant_001'
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: '创建时间',
    example: '2026-03-22 10:00:00'
  })
  @IsOptional()
  @IsString()
  createTime?: string;

  @ApiPropertyOptional({
    description: '创建人',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  createUser?: string;

  @ApiPropertyOptional({
    description: '更新时间',
    example: '2026-03-22 10:00:00'
  })
  @IsOptional()
  @IsString()
  updateTime?: string;

  @ApiPropertyOptional({
    description: '更新人',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  updateUser?: string;
}

export class UpdateDictionaryTypeDto {
  @ApiPropertyOptional({
    description: '字典类型名称',
    example: '系统通用状态'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '字典类型标签',
    example: '系统通用状态'
  })
  @IsOptional()
  @IsString()
  dictLabel?: string;

  @ApiPropertyOptional({
    description: '字典类型编码',
    example: 'COMMON_STATUS'
  })
  @IsOptional()
  @IsString()
  dictValue?: string;

  @ApiPropertyOptional({
    description: '字典分类',
    example: 'FRM'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: '权重',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @ApiPropertyOptional({
    description: '排序值',
    example: 200
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortCode?: number;

  @ApiPropertyOptional({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '删除标记',
    example: 'NOT_DELETE'
  })
  @IsOptional()
  @IsString()
  deleteFlag?: string;

  @ApiPropertyOptional({
    description: '租户 ID，租户上下文存在时以后端上下文为准',
    example: 'tenant_001'
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: '创建时间',
    example: '2026-03-22 10:00:00'
  })
  @IsOptional()
  @IsString()
  createTime?: string;

  @ApiPropertyOptional({
    description: '创建人',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  createUser?: string;

  @ApiPropertyOptional({
    description: '更新时间',
    example: '2026-03-22 11:00:00'
  })
  @IsOptional()
  @IsString()
  updateTime?: string;

  @ApiPropertyOptional({
    description: '更新人',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  updateUser?: string;
}
