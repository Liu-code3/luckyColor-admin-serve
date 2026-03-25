import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLE_DATA_SCOPE_VALUES } from './roles.constants';

export class RoleAssignedDepartmentResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '部门 ID',
    example: 100
  })
  id!: number;

  @ApiProperty({
    description: '父级部门 ID，根节点为 0',
    example: 0
  })
  pid!: number;

  @ApiProperty({
    description: '部门名称',
    example: '总部'
  })
  name!: string;

  @ApiProperty({
    description: '部门编码',
    example: 'headquarters'
  })
  code!: string;
}

export class RoleItemResponseDto {
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
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;

  @ApiProperty({
    description: '数据权限范围',
    enum: ROLE_DATA_SCOPE_VALUES,
    example: 'CUSTOM'
  })
  dataScope!: string;

  @ApiProperty({
    description: '自定义数据权限部门 ID 列表',
    type: [Number],
    example: [100, 120]
  })
  dataScopeDeptIds!: number[];

  @ApiPropertyOptional({
    description: '备注',
    example: '负责租户内的管理工作',
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

export class RolePageResponseDto {
  @ApiProperty({
    description: '总记录数',
    example: 3
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
    type: [RoleItemResponseDto]
  })
  records!: RoleItemResponseDto[];
}

export class RoleAssignedMenuResponseDto {
  @ApiProperty({
    description: '菜单 ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: '父级菜单 ID，根节点为 0',
    example: 0
  })
  pid!: number;

  @ApiProperty({
    description: '菜单标题',
    example: '系统管理'
  })
  title!: string;

  @ApiProperty({
    description: '路由名称',
    example: 'SystemManage'
  })
  name!: string;

  @ApiProperty({
    description: '菜单类型，1 目录，2 菜单，3 按钮',
    example: 1
  })
  type!: number;

  @ApiProperty({
    description: '访问路径',
    example: '/system'
  })
  path!: string;

  @ApiProperty({
    description: '权限标识',
    example: 'system:root'
  })
  key!: string;

  @ApiProperty({
    description: '权限点编码',
    example: 'system:root'
  })
  permissionCode!: string;

  @ApiProperty({
    description: '是否显示',
    example: true
  })
  isVisible!: boolean;

  @ApiProperty({
    description: '排序值',
    example: 1
  })
  sort!: number;
}

export class RoleMenuAssignmentResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  roleId!: string;

  @ApiProperty({
    description: '角色名称',
    example: '超级管理员'
  })
  name!: string;

  @ApiProperty({
    description: '角色编码',
    example: 'super_admin'
  })
  code!: string;

  @ApiProperty({
    description: '已分配菜单 ID 列表',
    type: [Number],
    example: [1, 2, 3, 11]
  })
  menuIds!: number[];

  @ApiProperty({
    description: '已分配菜单明细',
    type: [RoleAssignedMenuResponseDto]
  })
  menus!: RoleAssignedMenuResponseDto[];
}

export class RoleDataScopeResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  roleId!: string;

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
    description: '数据权限范围',
    enum: ROLE_DATA_SCOPE_VALUES,
    example: 'CUSTOM'
  })
  dataScope!: string;

  @ApiProperty({
    description: '自定义数据权限部门 ID 列表',
    type: [Number],
    example: [100, 120]
  })
  departmentIds!: number[];

  @ApiProperty({
    description: '自定义数据权限部门明细',
    type: [RoleAssignedDepartmentResponseDto]
  })
  departments!: RoleAssignedDepartmentResponseDto[];
}
