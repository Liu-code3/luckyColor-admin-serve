import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantPackageItemResponseDto {
  @ApiProperty({
    description: 'package id',
    example: 'pkg_basic'
  })
  id!: string;

  @ApiProperty({
    description: 'package code',
    example: 'basic'
  })
  code!: string;

  @ApiProperty({
    description: 'package name',
    example: '基础版套餐'
  })
  name!: string;

  @ApiProperty({
    description: 'package status',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: 'max users',
    example: 50,
    nullable: true
  })
  maxUsers?: number | null;

  @ApiPropertyOptional({
    description: 'max roles',
    example: 20,
    nullable: true
  })
  maxRoles?: number | null;

  @ApiPropertyOptional({
    description: 'max menus',
    example: 100,
    nullable: true
  })
  maxMenus?: number | null;

  @ApiPropertyOptional({
    description: 'feature flags',
    example: {
      watermark: true,
      dictionary: true,
      notices: true
    },
    nullable: true
  })
  featureFlags?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'remark',
    example: '默认基础租户套餐',
    nullable: true
  })
  remark?: string | null;

  @ApiProperty({
    description: 'created at',
    format: 'date-time',
    example: '2026-03-22T14:30:00.000Z'
  })
  createdAt!: string;

  @ApiProperty({
    description: 'updated at',
    format: 'date-time',
    example: '2026-03-22T15:00:00.000Z'
  })
  updatedAt!: string;
}

export class TenantPackagePageResponseDto {
  @ApiProperty({
    description: 'total records',
    example: 1
  })
  total!: number;

  @ApiProperty({
    description: 'current page',
    example: 1
  })
  current!: number;

  @ApiProperty({
    description: 'page size',
    example: 10
  })
  size!: number;

  @ApiProperty({
    description: 'page records',
    type: [TenantPackageItemResponseDto]
  })
  records!: TenantPackageItemResponseDto[];
}
