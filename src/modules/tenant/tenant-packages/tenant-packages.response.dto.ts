import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantPackageItemResponseDto {
  @ApiProperty({
    description: '套餐 ID',
    example: 'pkg_basic'
  })
  id!: string;

  @ApiProperty({
    description: '套餐编码',
    example: 'basic'
  })
  code!: string;

  @ApiProperty({
    description: '套餐名称',
    example: '基础版套餐'
  })
  name!: string;

  @ApiProperty({
    description: '套餐状态，`true` 表示启用，`false` 表示停用',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: '最大用户数',
    example: 50,
    nullable: true
  })
  maxUsers?: number | null;

  @ApiPropertyOptional({
    description: '最大角色数',
    example: 20,
    nullable: true
  })
  maxRoles?: number | null;

  @ApiPropertyOptional({
    description: '最大菜单数',
    example: 100,
    nullable: true
  })
  maxMenus?: number | null;

  @ApiPropertyOptional({
    description: '功能开关配置',
    example: {
      watermark: true,
      dictionary: true,
      notices: true
    },
    nullable: true
  })
  featureFlags?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: '备注',
    example: '默认基础租户套餐',
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

export class TenantPackagePageResponseDto {
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
    type: [TenantPackageItemResponseDto]
  })
  records!: TenantPackageItemResponseDto[];
}
