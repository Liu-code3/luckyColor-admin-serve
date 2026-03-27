import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuTreeItemResponseDto } from '../../system/menus/menus.response.dto';

export class LoginCaptchaChallengeResponseDto {
  @ApiProperty({
    description: '验证码题目 ID',
    example: 'cpt_01JQ8J4S9P4X1N5P4D2M8E7T0A'
  })
  captchaId!: string;

  @ApiProperty({
    description: '算术验证码 SVG 题面',
    example: '<svg>...</svg>'
  })
  captchaSvg!: string;

  @ApiProperty({
    description: '题面提示语',
    example: '请计算图中算式结果'
  })
  prompt!: string;

  @ApiProperty({
    description: '题面过期时间',
    example: '2026-03-26T09:31:40.000Z'
  })
  expiresAt!: string;
}

export class VerifyLoginCaptchaResponseDto {
  @ApiProperty({
    description: '验证码校验通过后签发的一次性登录令牌',
    example: 'cap_01JQ8J6K4SZQ7X6MEY9R2QG3TN'
  })
  captchaToken!: string;

  @ApiProperty({
    description: '登录令牌过期时间',
    example: '2026-03-26T09:32:10.000Z'
  })
  expiresAt!: string;
}

export class AuthRoleItemResponseDto {
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
    example: '超级管理员'
  })
  name!: string;

  @ApiProperty({
    description: '角色编码',
    example: 'super_admin'
  })
  code!: string;
}

export class AuthUserResponseDto {
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
    description: '角色编码列表',
    type: [String],
    example: ['super_admin']
  })
  roleCodes!: string[];

  @ApiProperty({
    description: '菜单权限标识列表，目录和菜单类型会汇总到这里',
    type: [String],
    example: ['main_system', 'main_system_users']
  })
  menuCodeList!: string[];

  @ApiProperty({
    description: '按钮权限标识列表，按钮类型会汇总到这里',
    type: [String],
    example: ['system:user:create', 'system:user:update']
  })
  buttonCodeList!: string[];
}

export class AuthAccessResponseDto {
  @ApiProperty({
    description: '当前登录用户信息',
    type: AuthUserResponseDto
  })
  user!: AuthUserResponseDto;

  @ApiProperty({
    description: '当前用户所属角色明细',
    type: [AuthRoleItemResponseDto]
  })
  roles!: AuthRoleItemResponseDto[];

  @ApiProperty({
    description: '当前用户可访问菜单树，仅包含目录和菜单类型',
    type: [MenuTreeItemResponseDto]
  })
  menuTree!: MenuTreeItemResponseDto[];
}

export class AuthRouteItemResponseDto {
  @ApiProperty({
    description: '路由访问路径',
    example: '/system'
  })
  path!: string;

  @ApiProperty({
    description: '路由名称',
    example: 'system'
  })
  name!: string;

  @ApiProperty({
    description: '前端组件标识',
    example: 'LAYOUT'
  })
  component!: string;

  @ApiPropertyOptional({
    description: '路由重定向地址',
    example: '/system/users',
    nullable: true
  })
  redirect?: string;

  @ApiProperty({
    description: '路由元信息',
    example: {
      title: '系统管理',
      icon: 'folder',
      hidden: false,
      order: 1,
      menuKey: 'main_system',
      permissionCode: 'main_system',
      type: 1,
      layout: 'default',
      keepAlive: true
    },
    additionalProperties: true
  })
  meta!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '子级路由节点',
    type: () => [AuthRouteItemResponseDto]
  })
  children?: AuthRouteItemResponseDto[];
}

export class AuthButtonPermissionResponseDto {
  @ApiProperty({
    description: '当前登录用户拥有的全部按钮权限码',
    type: [String],
    example: ['system:user:create', 'system:user:update']
  })
  buttonCodeList!: string[];

  @ApiProperty({
    description: '本次查询命中的按钮权限码列表，未传 codes 时等同于 buttonCodeList',
    type: [String],
    example: ['system:user:create']
  })
  grantedCodeList!: string[];

  @ApiProperty({
    description: '按钮权限命中映射，键为权限码，值为是否拥有该权限',
    example: {
      'system:user:create': true,
      'system:user:delete': false
    },
    additionalProperties: {
      type: 'boolean'
    }
  })
  permissionMap!: Record<string, boolean>;
}

export class LoginResultResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature'
  })
  accessToken!: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer'
  })
  tokenType!: string;

  @ApiProperty({
    description: '过期时间配置',
    example: '2h'
  })
  expiresIn!: string;

  @ApiProperty({
    description: '当前登录用户信息',
    type: AuthUserResponseDto
  })
  user!: AuthUserResponseDto;
}
