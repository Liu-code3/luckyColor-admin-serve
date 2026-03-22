import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserItemResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '用户 ID',
    example: 'clx1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '用户名',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: '系统管理员',
    nullable: true
  })
  nickname?: string | null;

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

export class UserPageResponseDto {
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
    type: [UserItemResponseDto]
  })
  records!: UserItemResponseDto[];
}

export class UserAssignedRoleResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '角色名称',
    example: '租户管理员'
  })
  name!: string;

  @ApiProperty({
    description: '角色编码',
    example: 'tenant_admin'
  })
  code!: string;

  @ApiProperty({
    description: '排序值',
    example: 10
  })
  sort!: number;

  @ApiProperty({
    description: '角色状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;
}

export class UserRoleAssignmentResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '用户 ID',
    example: 'clx1234567890'
  })
  userId!: string;

  @ApiProperty({
    description: '用户名',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: '系统管理员',
    nullable: true
  })
  nickname?: string | null;

  @ApiProperty({
    description: '已分配角色 ID 列表',
    type: [String],
    example: ['clxrole1234567890', 'clxrole0987654321']
  })
  roleIds!: string[];

  @ApiProperty({
    description: '已分配角色明细',
    type: [UserAssignedRoleResponseDto]
  })
  roles!: UserAssignedRoleResponseDto[];
}
