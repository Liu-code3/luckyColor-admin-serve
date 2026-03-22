import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { ROLE_DATA_SCOPE_VALUES, type RoleDataScope } from './roles.constants';

export class RoleListQueryDto {
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
    description: '角色名称或编码关键字',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateRoleDto {
  @ApiProperty({
    description: '角色名称',
    example: '租户管理员'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: '角色编码',
    example: 'tenant_admin'
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({
    description: '排序值',
    example: 10,
    default: 0
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
    description: '数据权限范围',
    enum: ROLE_DATA_SCOPE_VALUES,
    example: 'CUSTOM',
    default: 'ALL'
  })
  @IsOptional()
  @IsIn(ROLE_DATA_SCOPE_VALUES)
  dataScope?: RoleDataScope;

  @ApiPropertyOptional({
    description: '自定义数据权限部门 ID 列表，仅当 dataScope = CUSTOM 时生效',
    type: [Number],
    example: [100, 120]
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  dataScopeDeptIds?: number[];

  @ApiPropertyOptional({
    description: '备注',
    example: '负责租户内的管理工作'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: '角色名称',
    example: '租户管理员'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '角色编码',
    example: 'tenant_admin'
  })
  @IsOptional()
  @IsString()
  code?: string;

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
    description: '数据权限范围',
    enum: ROLE_DATA_SCOPE_VALUES,
    example: 'DEPARTMENT_AND_CHILDREN'
  })
  @IsOptional()
  @IsIn(ROLE_DATA_SCOPE_VALUES)
  dataScope?: RoleDataScope;

  @ApiPropertyOptional({
    description: '自定义数据权限部门 ID 列表，仅当 dataScope = CUSTOM 时生效',
    type: [Number],
    example: [100, 110]
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  dataScopeDeptIds?: number[];

  @ApiPropertyOptional({
    description: '备注',
    example: '更新后的角色备注'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}

export class AssignRoleMenusDto {
  @ApiProperty({
    description: '菜单 ID 列表，传空数组表示清空当前角色所有菜单权限',
    example: [1, 2, 3, 11]
  })
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  menuIds!: number[];
}

export class AssignRoleDataScopeDto {
  @ApiProperty({
    description: '数据权限范围',
    enum: ROLE_DATA_SCOPE_VALUES,
    example: 'CUSTOM'
  })
  @IsIn(ROLE_DATA_SCOPE_VALUES)
  dataScope!: RoleDataScope;

  @ApiPropertyOptional({
    description: '自定义数据权限部门 ID 列表，仅当 dataScope = CUSTOM 时必填',
    type: [Number],
    example: [100, 120]
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  departmentIds?: number[];
}
