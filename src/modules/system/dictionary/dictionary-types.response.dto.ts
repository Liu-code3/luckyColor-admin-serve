import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DictionaryTypeItemResponseDto {
  @ApiProperty({
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  id!: string;

  @ApiProperty({
    description: '字典类型名称',
    example: '系统通用状态'
  })
  name!: string;

  @ApiPropertyOptional({
    description: '租户 ID',
    example: 'tenant_001',
    nullable: true
  })
  tenantId?: string | null;

  @ApiProperty({
    description: '字典类型标签',
    example: '系统通用状态'
  })
  dictLabel!: string;

  @ApiProperty({
    description: '字典类型编码',
    example: 'COMMON_STATUS'
  })
  dictValue!: string;

  @ApiProperty({
    description: '字典分类',
    example: 'FRM'
  })
  category!: string;

  @ApiProperty({
    description: '权重',
    example: 10
  })
  weight!: number;

  @ApiProperty({
    description: '排序值',
    example: 100
  })
  sortCode!: number;

  @ApiProperty({
    description: '删除标记',
    example: 'NOT_DELETE'
  })
  deleteFlag!: string;

  @ApiPropertyOptional({
    description: '创建时间',
    example: '2026-03-22 10:00:00',
    nullable: true
  })
  createTime?: string | null;

  @ApiPropertyOptional({
    description: '创建人',
    example: 'admin',
    nullable: true
  })
  createUser?: string | null;

  @ApiPropertyOptional({
    description: '更新时间',
    example: '2026-03-22 11:00:00',
    nullable: true
  })
  updateTime?: string | null;

  @ApiPropertyOptional({
    description: '更新人',
    example: 'admin',
    nullable: true
  })
  updateUser?: string | null;

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
    example: '2026-03-22T10:00:00.000Z'
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
    example: '2026-03-22T11:00:00.000Z'
  })
  updatedAt!: string;
}

export class DictionaryTypePageResponseDto {
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
    description: '分页记录',
    type: [DictionaryTypeItemResponseDto]
  })
  records!: DictionaryTypeItemResponseDto[];
}
