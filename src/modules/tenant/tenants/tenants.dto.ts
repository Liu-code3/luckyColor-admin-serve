import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { TENANT_STATUS_VALUES, type TenantStatus } from './tenant.constants';
import {
  LIST_SORT_ORDER_VALUES,
  type ListSortOrder
} from '../../../shared/api/list-query.util';

const TENANT_LIST_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'code',
  'status',
  'expiresAt'
] as const;

export class TenantListQueryDto {
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
    description: '租户名称或租户编码关键字',
    example: '默认'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '租户状态',
    enum: TENANT_STATUS_VALUES,
    example: 'ACTIVE'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'sort field',
    enum: TENANT_LIST_SORT_FIELDS,
    example: 'createdAt'
  })
  @IsOptional()
  @IsIn(TENANT_LIST_SORT_FIELDS)
  sortBy?: (typeof TENANT_LIST_SORT_FIELDS)[number];

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

export class CreateTenantDto {
  @ApiPropertyOptional({
    description: '租户 ID，不传时自动生成',
    example: 'tenant_1001'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: '租户编码',
    example: 'acme'
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: '租户名称',
    example: 'Acme 科技'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: '租户套餐 ID，不传时默认使用首个启用套餐',
    example: 'pkg_basic'
  })
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({
    description: '租户状态',
    enum: TENANT_STATUS_VALUES,
    example: 'ACTIVE',
    default: 'ACTIVE'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: '到期时间',
    example: '2027-03-22T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: '联系人姓名',
    example: '张三'
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13800000003'
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: '联系邮箱',
    example: 'zhangsan@acme.local'
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: '租户备注',
    example: '平台管理员创建'
  })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({
    description: '管理员账号',
    example: 'admin',
    default: 'admin'
  })
  @IsOptional()
  @IsString()
  adminUsername?: string;

  @ApiProperty({
    description: '管理员密码',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword!: string;

  @ApiPropertyOptional({
    description: '管理员昵称',
    example: 'Acme 管理员'
  })
  @IsOptional()
  @IsString()
  adminNickname?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: '租户名称',
    example: 'Acme 科技专业版'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: '租户套餐 ID',
    example: 'pkg_pro'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  packageId?: string;

  @ApiPropertyOptional({
    description: '租户状态',
    enum: TENANT_STATUS_VALUES,
    example: 'FROZEN'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: '到期时间，传 null 表示清空',
    example: '2027-06-30T00:00:00.000Z',
    nullable: true
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: '联系人姓名，传 null 表示清空',
    example: '李四',
    nullable: true
  })
  @IsOptional()
  @IsString()
  contactName?: string | null;

  @ApiPropertyOptional({
    description: '联系电话，传 null 表示清空',
    example: '13900000000',
    nullable: true
  })
  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @ApiPropertyOptional({
    description: '联系邮箱，传 null 表示清空',
    example: 'lisi@acme.local',
    nullable: true
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @ApiPropertyOptional({
    description: '租户备注，传 null 表示清空',
    example: '续费并升级套餐',
    nullable: true
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
