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
    description: '套餐名称或套餐编码关键字',
    example: '基础'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '套餐状态，`true` 表示启用，`false` 表示停用',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;
}

export class CreateTenantPackageDto {
  @ApiPropertyOptional({
    description: '套餐 ID，不传时自动按编码生成',
    example: 'pkg_basic'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: '套餐编码',
    example: 'basic'
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: '套餐名称',
    example: '基础版套餐'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: '套餐状态，默认启用',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '最大用户数',
    example: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: '最大角色数',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRoles?: number;

  @ApiPropertyOptional({
    description: '最大菜单数',
    example: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMenus?: number;

  @ApiPropertyOptional({
    description: '功能开关配置',
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
    description: '备注',
    example: '默认基础租户套餐'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateTenantPackageDto {
  @ApiPropertyOptional({
    description: '套餐编码',
    example: 'pro'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({
    description: '套餐名称',
    example: '专业版套餐'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: '套餐状态，`true` 表示启用，`false` 表示停用',
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '最大用户数',
    example: 200
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUsers?: number;

  @ApiPropertyOptional({
    description: '最大角色数',
    example: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRoles?: number;

  @ApiPropertyOptional({
    description: '最大菜单数',
    example: 300
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMenus?: number;

  @ApiPropertyOptional({
    description: '功能开关配置',
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
    description: '备注，传 null 表示清空',
    example: '升级后的套餐能力',
    nullable: true
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
