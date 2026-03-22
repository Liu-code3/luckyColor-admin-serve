import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoticeItemResponseDto {
  @ApiProperty({
    description: '公告 ID',
    example: 'clxnotice1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '公告标题',
    example: '版本更新提醒'
  })
  title!: string;

  @ApiProperty({
    description: '公告内容',
    example: '本周将上线多租户配置中心，请提前关注菜单与权限变更。'
  })
  content!: string;

  @ApiProperty({
    description: '公告类型',
    example: 'release'
  })
  type!: string;

  @ApiProperty({
    description: '发布状态，true 已发布，false 草稿',
    example: false
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队',
    nullable: true
  })
  publisher?: string | null;

  @ApiPropertyOptional({
    description: '发布时间',
    format: 'date-time',
    example: '2026-03-22T08:00:00.000Z',
    nullable: true
  })
  publishedAt?: string | null;

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

export class NoticePageResponseDto {
  @ApiProperty({
    description: '总记录数',
    example: 2
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
    type: [NoticeItemResponseDto]
  })
  records!: NoticeItemResponseDto[];
}
