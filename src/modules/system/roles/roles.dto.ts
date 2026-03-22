import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

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
    description: '备注',
    example: '更新后的角色备注'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
