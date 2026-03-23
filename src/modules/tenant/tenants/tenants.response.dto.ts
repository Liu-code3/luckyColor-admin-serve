import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantPackageSummaryResponseDto {
  @ApiProperty({
    description: '套餐 ID',
    example: 'pkg_basic'
  })
  id!: string;

  @ApiProperty({
    description: '套餐编码',
    example: 'basic'
  })
  code!: string;

  @ApiProperty({
    description: '套餐名称',
    example: '基础版套餐'
  })
  name!: string;

  @ApiProperty({
    description: '套餐状态，`true` 表示启用，`false` 表示停用',
    example: true
  })
  status!: boolean;
}

export class TenantItemResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  id!: string;

  @ApiProperty({
    description: '租户编码',
    example: 'default'
  })
  code!: string;

  @ApiProperty({
    description: '租户名称',
    example: '默认租户'
  })
  name!: string;

  @ApiProperty({
    description: '租户状态',
    example: 'ACTIVE'
  })
  status!: string;

  @ApiPropertyOptional({
    description: '到期时间',
    format: 'date-time',
    example: '2099-12-31T23:59:59.000Z',
    nullable: true
  })
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: '联系人姓名',
    example: '系统管理员',
    nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13800000000',
    nullable: true
  })
  contactPhone?: string | null;

  @ApiPropertyOptional({
    description: '联系邮箱',
    example: 'admin@luckycolor.local',
    nullable: true
  })
  contactEmail?: string | null;

  @ApiPropertyOptional({
    description: '当前租户套餐摘要',
    type: TenantPackageSummaryResponseDto,
    nullable: true
  })
  tenantPackage?: TenantPackageSummaryResponseDto | null;

  @ApiPropertyOptional({
    description: '备注',
    example: '本地初始化默认租户',
    nullable: true
  })
  remark?: string | null;

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
    example: '2026-03-22T14:30:00.000Z'
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
    example: '2026-03-22T15:00:00.000Z'
  })
  updatedAt!: string;
}

export class TenantPageResponseDto {
  @ApiProperty({
    description: '总记录数',
    example: 1
  })
  total!: number;

  @ApiProperty({
    description: '当前页码',
    example: 1
  })
  current!: number;

  @ApiProperty({
    description: '每页条数',
    example: 10
  })
  size!: number;

  @ApiProperty({
    description: '分页数据',
    type: [TenantItemResponseDto]
  })
  records!: TenantItemResponseDto[];
}

export class TenantInitAdminResponseDto {
  @ApiProperty({
    description: '管理员用户 ID',
    example: 'clxuser1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '管理员账号',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: '管理员昵称',
    example: 'Acme 管理员',
    nullable: true
  })
  nickname?: string | null;
}

export class TenantInitRoleResponseDto {
  @ApiProperty({
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '角色编码',
    example: 'tenant_admin'
  })
  code!: string;

  @ApiProperty({
    description: '角色名称',
    example: '租户管理员'
  })
  name!: string;
}

export class TenantInitDepartmentResponseDto {
  @ApiProperty({
    description: '部门 ID',
    example: 201
  })
  id!: number;

  @ApiProperty({
    description: '部门编码',
    example: 'acme_headquarters'
  })
  code!: string;

  @ApiProperty({
    description: '部门名称',
    example: '总部'
  })
  name!: string;
}

export class TenantInitResultResponseDto {
  @ApiProperty({
    description: '创建后的租户信息',
    type: TenantItemResponseDto
  })
  tenant!: TenantItemResponseDto;

  @ApiProperty({
    description: '创建后的管理员账号信息',
    type: TenantInitAdminResponseDto
  })
  adminUser!: TenantInitAdminResponseDto;

  @ApiProperty({
    description: '初始化的角色列表',
    type: [TenantInitRoleResponseDto]
  })
  roles!: TenantInitRoleResponseDto[];

  @ApiProperty({
    description: '初始化的部门列表',
    type: [TenantInitDepartmentResponseDto]
  })
  departments!: TenantInitDepartmentResponseDto[];

  @ApiProperty({
    description: '初始化分配的菜单 ID 列表',
    type: [Number],
    example: [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14]
  })
  menuIds!: number[];

  @ApiProperty({
    description: '初始化创建的字典 ID 列表',
    type: [String],
    example: [
      'tenant_1001_notice_scope_root',
      'tenant_1001_notice_scope_all',
      'tenant_1001_notice_scope_department',
      'tenant_1001_notice_scope_role'
    ]
  })
  dictionaryIds!: string[];
}
