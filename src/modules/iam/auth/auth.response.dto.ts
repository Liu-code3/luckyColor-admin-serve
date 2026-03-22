import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuTreeItemResponseDto } from '../../system/menus/menus.response.dto';

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
