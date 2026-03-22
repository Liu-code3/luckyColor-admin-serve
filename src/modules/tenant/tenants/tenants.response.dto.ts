import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantPackageSummaryResponseDto {
  @ApiProperty({
    description: 'package id',
    example: 'pkg_basic'
  })
  id!: string;

  @ApiProperty({
    description: 'package code',
    example: 'basic'
  })
  code!: string;

  @ApiProperty({
    description: 'package name',
    example: '基础版套餐'
  })
  name!: string;

  @ApiProperty({
    description: 'package status',
    example: true
  })
  status!: boolean;
}

export class TenantItemResponseDto {
  @ApiProperty({
    description: 'tenant id',
    example: 'tenant_001'
  })
  id!: string;

  @ApiProperty({
    description: 'tenant code',
    example: 'default'
  })
  code!: string;

  @ApiProperty({
    description: 'tenant name',
    example: '默认租户'
  })
  name!: string;

  @ApiProperty({
    description: 'tenant status',
    example: 'ACTIVE'
  })
  status!: string;

  @ApiPropertyOptional({
    description: 'expires at',
    format: 'date-time',
    example: '2099-12-31T23:59:59.000Z',
    nullable: true
  })
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: 'contact name',
    example: '系统管理员',
    nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: 'contact phone',
    example: '13800000000',
    nullable: true
  })
  contactPhone?: string | null;

  @ApiPropertyOptional({
    description: 'contact email',
    example: 'admin@luckycolor.local',
    nullable: true
  })
  contactEmail?: string | null;

  @ApiPropertyOptional({
    description: 'tenant package summary',
    type: TenantPackageSummaryResponseDto,
    nullable: true
  })
  tenantPackage?: TenantPackageSummaryResponseDto | null;

  @ApiPropertyOptional({
    description: 'remark',
    example: '本地初始化默认租户',
    nullable: true
  })
  remark?: string | null;

  @ApiProperty({
    description: 'created at',
    format: 'date-time',
    example: '2026-03-22T14:30:00.000Z'
  })
  createdAt!: string;

  @ApiProperty({
    description: 'updated at',
    format: 'date-time',
    example: '2026-03-22T15:00:00.000Z'
  })
  updatedAt!: string;
}

export class TenantPageResponseDto {
  @ApiProperty({
    description: 'total records',
    example: 1
  })
  total!: number;

  @ApiProperty({
    description: 'current page',
    example: 1
  })
  current!: number;

  @ApiProperty({
    description: 'page size',
    example: 10
  })
  size!: number;

  @ApiProperty({
    description: 'page records',
    type: [TenantItemResponseDto]
  })
  records!: TenantItemResponseDto[];
}

export class TenantInitAdminResponseDto {
  @ApiProperty({
    description: 'admin user id',
    example: 'clxuser1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'admin username',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: 'admin nickname',
    example: 'Acme Admin',
    nullable: true
  })
  nickname?: string | null;
}

export class TenantInitRoleResponseDto {
  @ApiProperty({
    description: 'role id',
    example: 'clxrole1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'role code',
    example: 'tenant_admin'
  })
  code!: string;

  @ApiProperty({
    description: 'role name',
    example: 'Tenant Admin'
  })
  name!: string;
}

export class TenantInitDepartmentResponseDto {
  @ApiProperty({
    description: 'department id',
    example: 201
  })
  id!: number;

  @ApiProperty({
    description: 'department code',
    example: 'acme_headquarters'
  })
  code!: string;

  @ApiProperty({
    description: 'department name',
    example: 'Headquarters'
  })
  name!: string;
}

export class TenantInitResultResponseDto {
  @ApiProperty({
    description: 'created tenant',
    type: TenantItemResponseDto
  })
  tenant!: TenantItemResponseDto;

  @ApiProperty({
    description: 'created admin user',
    type: TenantInitAdminResponseDto
  })
  adminUser!: TenantInitAdminResponseDto;

  @ApiProperty({
    description: 'initialized roles',
    type: [TenantInitRoleResponseDto]
  })
  roles!: TenantInitRoleResponseDto[];

  @ApiProperty({
    description: 'initialized departments',
    type: [TenantInitDepartmentResponseDto]
  })
  departments!: TenantInitDepartmentResponseDto[];

  @ApiProperty({
    description: 'assigned menu ids',
    type: [Number],
    example: [1, 2, 3, 4, 5]
  })
  menuIds!: number[];

  @ApiProperty({
    description: 'initialized dictionary ids',
    type: [String],
    example: ['tenant_1001_notice_scope_root', 'tenant_1001_notice_scope_all']
  })
  dictionaryIds!: string[];
}
