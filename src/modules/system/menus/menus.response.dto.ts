import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MenuItemResponseDto {
  @ApiProperty({
    description: '父级菜单 ID，根节点为 0',
    example: 0
  })
  pid!: number;

  @ApiProperty({
    description: '菜单 ID',
    example: 1001
  })
  id!: number;

  @ApiProperty({
    description: '菜单标题',
    example: '用户管理'
  })
  title!: string;

  @ApiProperty({
    description: '路由名称',
    example: 'UserManage'
  })
  name!: string;

  @ApiProperty({
    description: '菜单类型，1 目录，2 菜单，3 按钮',
    example: 2
  })
  type!: number;

  @ApiProperty({
    description: '访问路径',
    example: '/system/users'
  })
  path!: string;

  @ApiProperty({
    description: '权限标识',
    example: 'system:user:list'
  })
  key!: string;

  @ApiPropertyOptional({
    description: '图标名称',
    example: 'UserOutlined'
  })
  icon?: string;

  @ApiPropertyOptional({
    description: '布局标识',
    example: 'default'
  })
  layout?: string;

  @ApiProperty({
    description: '是否显示',
    example: true
  })
  isVisible!: boolean;

  @ApiProperty({
    description: '菜单状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;

  @ApiProperty({
    description: '前端组件路径',
    example: 'system/users/index'
  })
  component!: string;

  @ApiPropertyOptional({
    description: '重定向路径',
    example: '/system/users/list',
    nullable: true
  })
  redirect?: string | null;

  @ApiPropertyOptional({
    description: '路由元信息',
    type: Object,
    additionalProperties: true,
    example: {
      title: '用户管理',
      keepAlive: true
    },
    nullable: true
  })
  meta?: Record<string, unknown> | null;

  @ApiProperty({
    description: '排序值',
    example: 10
  })
  sort!: number;

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

export class MenuTreeItemResponseDto extends MenuItemResponseDto {
  @ApiPropertyOptional({
    description: '子菜单节点',
    type: () => [MenuTreeItemResponseDto]
  })
  children?: MenuTreeItemResponseDto[];
}

export class MenuPageResponseDto {
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
    type: [MenuItemResponseDto]
  })
  records!: MenuItemResponseDto[];
}
