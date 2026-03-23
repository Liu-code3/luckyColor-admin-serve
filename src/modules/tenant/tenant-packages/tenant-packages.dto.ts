import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class TenantPackageListQueryDto {
  @ApiPropertyOptional({
    description: 'page number',
    example: 1,
    default: 1
  })
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'page size',
    example: 10,
    default: 10
  })
  @Type(() => Number)
  @Min(1)
  size = 10;

  @ApiPropertyOptional({
    description: 'keyword for package name or code',
    example: 'basic'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'package status',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;
}

export class CreateTenantPackageDto {
  @ApiPropertyOptional({
    description: 'package id, auto-generated when omitted',
    example: 'pkg_basic'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'package code',
    example: 'basic'
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'package name',
    example: '基础版套餐'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'package status',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'max users',
    example: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'max roles',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRoles?: number;

  @ApiPropertyOptional({
    description: 'max menus',
    example: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMenus?: number;

  @ApiPropertyOptional({
    description: 'feature flags',
    example: {
      watermark: true,
      dictionary: true,
      notices: true
    }
  })
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'remark',
    example: '默认基础租户套餐'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTenantPackageDto {
  @ApiPropertyOptional({
    description: 'package code',
    example: 'pro'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({
    description: 'package name',
    example: '专业版套餐'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'package status',
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'max users',
    example: 200
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'max roles',
    example: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRoles?: number;

  @ApiPropertyOptional({
    description: 'max menus',
    example: 300
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMenus?: number;

  @ApiPropertyOptional({
    description: 'feature flags',
    example: {
      watermark: true,
      dictionary: true,
      notices: true,
      analytics: true
    }
  })
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'remark, pass null to clear',
    example: '升级后的套餐能力',
    nullable: true
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
