import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import {
  LIST_SORT_ORDER_VALUES,
  type ListSortOrder
} from '../../../shared/api/list-query.util';

const DEPARTMENT_LIST_SORT_FIELDS = [
  'sort',
  'id',
  'name',
  'code',
  'status',
  'createdAt',
  'updatedAt'
] as const;

const DEPARTMENT_USER_LIST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'username',
  'nickname',
  'status'
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

export class DepartmentListQueryDto {
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
    description: '部门名称或编码关键字',
    example: '研发'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '部门状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'sort field',
    enum: DEPARTMENT_LIST_SORT_FIELDS,
    example: 'sort'
  })
  @IsOptional()
  @IsIn(DEPARTMENT_LIST_SORT_FIELDS)
  sortBy?: (typeof DEPARTMENT_LIST_SORT_FIELDS)[number];

  @ApiPropertyOptional({
    description: 'sort order',
    enum: LIST_SORT_ORDER_VALUES,
    example: 'asc',
    default: 'asc'
  })
  @IsOptional()
  @IsIn(LIST_SORT_ORDER_VALUES)
  sortOrder?: ListSortOrder;
}

export class DepartmentUsersQueryDto {
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
    description: '用户名、昵称、手机号或邮箱关键字',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '用户状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'sort field',
    enum: DEPARTMENT_USER_LIST_SORT_FIELDS,
    example: 'createdAt'
  })
  @IsOptional()
  @IsIn(DEPARTMENT_USER_LIST_SORT_FIELDS)
  sortBy?: (typeof DEPARTMENT_USER_LIST_SORT_FIELDS)[number];

  @ApiPropertyOptional({
    description: 'sort order',
    enum: LIST_SORT_ORDER_VALUES,
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsIn(LIST_SORT_ORDER_VALUES)
  sortOrder?: ListSortOrder;

  @ApiPropertyOptional({
    description: '是否包含子部门用户，true 为包含，false 为仅当前部门',
    example: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  includeChildren?: boolean;
}

export class CreateDepartmentDto {
  @ApiPropertyOptional({
    description: '部门 ID，不传则自动分配',
    example: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    description: '父级部门 ID，顶级部门可为空',
    example: 0,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @ApiProperty({
    description: '部门名称',
    example: '产品研发部'
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: '部门编码',
    example: 'product_rd'
  })
  @IsString()
  code!: string;

  @ApiPropertyOptional({
    description: '负责人',
    example: '李工'
  })
  @IsOptional()
  @IsString()
  leader?: string;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13800000001'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: '联系邮箱',
    example: 'rd@luckycolor.local'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: '排序值',
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({
    description: '状态，true 启用，false 停用',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '负责产品设计与技术研发'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: '父级部门 ID',
    example: 100,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({
    description: '部门名称',
    example: '产品研发部'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '部门编码',
    example: 'product_rd'
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '负责人',
    example: '李工'
  })
  @IsOptional()
  @IsString()
  leader?: string | null;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13800000001'
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description: '联系邮箱',
    example: 'rd@luckycolor.local'
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: '排序值',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({
    description: '状态，true 启用，false 停用',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '更新后的部门备注'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}

export class UpdateDepartmentStatusDto {
  @ApiProperty({
    description: '部门状态，true 为启用，false 为停用',
    example: true
  })
  @Type(() => Boolean)
  @IsBoolean()
  status!: boolean;
}
