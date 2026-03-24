import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import {
  MENU_TREE_VIEW_VALUES,
  MENU_TYPE_VALUES,
  type MenuTreeView,
  type MenuType
} from '../../../shared/constants/menu.constants';

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

export class MenuListQueryDto {
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
    description: '菜单标题关键字',
    example: '系统'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '菜单状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;
}

export class CreateMenuDto {
  @ApiPropertyOptional({
    description: '菜单 ID，不传则自动分配',
    example: 1001
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional({
    description: '父级菜单 ID，顶级菜单可为空',
    example: 0,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @ApiProperty({
    description: '菜单标题',
    example: '用户管理'
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: '路由名称',
    example: 'UserManage'
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: '菜单类型，1 目录，2 菜单，3 按钮',
    example: 2
  })
  @Type(() => Number)
  @IsInt()
  @IsIn(MENU_TYPE_VALUES)
  type!: MenuType;

  @ApiProperty({
    description: '访问路径',
    example: '/system/users'
  })
  @IsString()
  path!: string;

  @ApiProperty({
    description: '权限标识',
    example: 'system:user:list'
  })
  @IsString()
  menuKey!: string;

  @ApiPropertyOptional({
    description: '图标名称',
    example: 'UserOutlined'
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: '布局标识',
    example: 'default'
  })
  @IsOptional()
  @IsString()
  layout?: string;

  @ApiProperty({
    description: '是否显示',
    example: true,
    default: true
  })
  @Type(() => Boolean)
  @IsBoolean()
  isVisible = true;

  @ApiPropertyOptional({
    description: '菜单状态，true 为启用，false 为停用',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiProperty({
    description: '前端组件路径',
    example: 'system/users/index'
  })
  @IsString()
  component!: string;

  @ApiPropertyOptional({
    description: '重定向地址',
    example: '/system/users/list'
  })
  @IsOptional()
  @IsString()
  redirect?: string;

  @ApiPropertyOptional({
    description: '路由元信息',
    example: {
      title: '用户管理',
      keepAlive: true
    }
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '排序值',
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

export class UpdateMenuDto {
  @ApiPropertyOptional({
    description: '父级菜单 ID',
    example: 1000,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @ApiPropertyOptional({
    description: '菜单标题',
    example: '用户管理'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '路由名称',
    example: 'UserManage'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '菜单类型，1 目录，2 菜单，3 按钮',
    example: 2
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(MENU_TYPE_VALUES)
  type?: MenuType;

  @ApiPropertyOptional({
    description: '访问路径',
    example: '/system/users'
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: '权限标识',
    example: 'system:user:list'
  })
  @IsOptional()
  @IsString()
  menuKey?: string;

  @ApiPropertyOptional({
    description: '图标名称',
    example: 'UserOutlined'
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: '布局标识',
    example: 'default'
  })
  @IsOptional()
  @IsString()
  layout?: string;

  @ApiPropertyOptional({
    description: '是否显示',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: '菜单状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '前端组件路径',
    example: 'system/users/index'
  })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiPropertyOptional({
    description: '重定向地址',
    example: '/system/users/list',
    nullable: true
  })
  @IsOptional()
  @IsString()
  redirect?: string | null;

  @ApiPropertyOptional({
    description: '路由元信息',
    example: {
      title: '用户管理',
      keepAlive: true
    },
    nullable: true
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: '排序值',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

export class MenuTreeQueryDto {
  @ApiPropertyOptional({
    description:
      '菜单树视角，platform 返回全量菜单树，tenant 返回当前租户已授权菜单树',
    enum: MENU_TREE_VIEW_VALUES,
    example: 'platform',
    default: 'platform'
  })
  @IsOptional()
  @IsIn(MENU_TREE_VIEW_VALUES)
  view?: MenuTreeView;

  @ApiPropertyOptional({
    description: '角色 ID，传入后返回该角色已分配菜单树',
    example: 'clxrole1234567890'
  })
  @IsOptional()
  @IsString()
  roleId?: string;
}

export class SyncMenuItemDto {
  @ApiProperty({
    description: '菜单 ID',
    example: 1001
  })
  @Type(() => Number)
  @IsInt()
  id!: number;

  @ApiProperty({
    description: '父级菜单 ID，顶级菜单传 null',
    example: null,
    nullable: true
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  parentId!: number | null;

  @ApiProperty({
    description: '排序值',
    example: 10
  })
  @Type(() => Number)
  @IsInt()
  sort!: number;
}

export class SyncMenusDto {
  @ApiProperty({
    description: '待同步的菜单树节点列表，支持批量更新父级挂载和排序值',
    type: [SyncMenuItemDto],
    example: [
      {
        id: 1000,
        parentId: null,
        sort: 1
      },
      {
        id: 1001,
        parentId: 1000,
        sort: 10
      }
    ]
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SyncMenuItemDto)
  menus!: SyncMenuItemDto[];
}

export class UpdateMenuStatusDto {
  @ApiProperty({
    description: '菜单状态，true 为启用，false 为停用；停用时会级联停用子菜单',
    example: true
  })
  @Type(() => Boolean)
  @IsBoolean()
  status!: boolean;
}
