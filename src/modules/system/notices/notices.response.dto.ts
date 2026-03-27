import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoticeItemResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '公告 ID',
    example: 'notice_1'
  })
  id!: string;

  @ApiProperty({
    description: '公告标题',
    example: '版本发布提醒'
  })
  title!: string;

  @ApiProperty({
    description: '公告内容',
    example: '请在新版本上线前完成角色权限复核。'
  })
  content!: string;

  @ApiProperty({
    description: '公告类型',
    example: 'release'
  })
  type!: string;

  @ApiProperty({
    description: '发布状态',
    example: false
  })
  status!: boolean;

  @ApiProperty({
    description: '发布范围',
    example: 'ROLE'
  })
  publishScope!: string;

  @ApiProperty({
    description: '目标部门 ID 列表',
    type: [Number],
    example: [100, 120]
  })
  targetDepartmentIds!: number[];

  @ApiProperty({
    description: '目标角色编码列表',
    type: [String],
    example: ['tenant_admin']
  })
  targetRoleCodes!: string[];

  @ApiProperty({
    description: '是否置顶',
    example: true
  })
  isPinned!: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队',
    nullable: true
  })
  publisher?: string | null;

  @ApiPropertyOptional({
    description: '计划发布时间',
    format: 'date-time',
    example: '2026-03-28T08:00:00.000Z',
    nullable: true
  })
  scheduledPublishAt?: string | null;

  @ApiPropertyOptional({
    description: '实际发布时间',
    format: 'date-time',
    example: '2026-03-28T08:00:00.000Z',
    nullable: true
  })
  publishedAt?: string | null;

  @ApiPropertyOptional({
    description: '事件键',
    example: 'release.reminder',
    nullable: true
  })
  eventKey?: string | null;

  @ApiPropertyOptional({
    description: '事件载荷',
    example: { channel: 'dashboard' },
    nullable: true
  })
  eventPayload?: Record<string, unknown> | null;

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
    description: '当前页记录',
    type: [NoticeItemResponseDto]
  })
  records!: NoticeItemResponseDto[];
}
