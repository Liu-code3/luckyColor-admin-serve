import { randomUUID } from 'node:crypto';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DictionaryPageQueryDto {
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
    description: '字典节点 ID',
    example: 'dict_root'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: '字典标签关键字',
    example: '状态'
  })
  @IsOptional()
  @IsString()
  searchKey?: string;
}

export class CreateDictionaryDto {
  @ApiPropertyOptional({
    description: '字典 ID，不传则自动生成',
    example: 'dict_status'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: '父级字典 ID',
    example: 'dict_root'
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: '权重',
    example: 10
  })
  @Type(() => Number)
  @IsInt()
  weight!: number;

  @ApiProperty({
    description: '名称',
    example: '状态字典'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: '租户 ID',
    example: 'tenant_001'
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({
    description: '字典标签',
    example: '启用'
  })
  @IsString()
  @IsNotEmpty()
  dictLabel!: string;

  @ApiProperty({
    description: '字典值',
    example: 'enabled'
  })
  @IsString()
  @IsNotEmpty()
  dictValue!: string;

  @ApiProperty({
    description: '字典分类',
    example: 'system_status'
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: '排序编码',
    example: 100
  })
  @Type(() => Number)
  @IsInt()
  sortCode!: number;

  @ApiProperty({
    description: '删除标记',
    example: '0'
  })
  @IsString()
  @IsNotEmpty()
  deleteFlag!: string;

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

export class UpdateDictionaryDto {
  @ApiPropertyOptional({
    description: '父级字典 ID',
    example: 'dict_root'
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: '权重',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @ApiPropertyOptional({
    description: '名称',
    example: '状态字典'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '租户 ID',
    example: 'tenant_001'
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: '字典标签',
    example: '停用'
  })
  @IsOptional()
  @IsString()
  dictLabel?: string;

  @ApiPropertyOptional({
    description: '字典值',
    example: 'disabled'
  })
  @IsOptional()
  @IsString()
  dictValue?: string;

  @ApiPropertyOptional({
    description: '字典分类',
    example: 'system_status'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: '排序编码',
    example: 200
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortCode?: number;

  @ApiPropertyOptional({
    description: '删除标记',
    example: '0'
  })
  @IsOptional()
  @IsString()
  deleteFlag?: string;

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

export function createDictionaryId(id?: string) {
  return id?.trim() || randomUUID().replace(/-/g, '');
}
