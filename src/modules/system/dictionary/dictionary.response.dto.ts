import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DictionaryItemResponseDto {
  @ApiProperty({
    description: '字典 ID',
    example: 'dict_root'
  })
  id!: string;

  @ApiProperty({
    description: '父级字典 ID，根节点为 0',
    example: '0'
  })
  parentId!: string;

  @ApiProperty({
    description: '权重',
    example: 10
  })
  weight!: number;

  @ApiProperty({
    description: '名称',
    example: '状态字典'
  })
  name!: string;

  @ApiPropertyOptional({
    description: '租户 ID',
    example: 'tenant_001',
    nullable: true
  })
  tenantId?: string | null;

  @ApiProperty({
    description: '字典标签',
    example: '启用'
  })
  dictLabel!: string;

  @ApiProperty({
    description: '字典值',
    example: 'enabled'
  })
  dictValue!: string;

  @ApiProperty({
    description: '分类编码',
    example: 'system_status'
  })
  category!: string;

  @ApiProperty({
    description: '排序编码',
    example: 100
  })
  sortCode!: number;

  @ApiProperty({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;

  @ApiProperty({
    description: '删除标记',
    example: '0'
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

export class DictionaryTreeItemResponseDto extends DictionaryItemResponseDto {
  @ApiPropertyOptional({
    description: '子级字典节点',
    type: () => [DictionaryTreeItemResponseDto]
  })
  children?: DictionaryTreeItemResponseDto[];
}

export class DictionaryPageResponseDto {
  @ApiProperty({
    description: '总记录数',
    example: 2
  })
  total!: number;

  @ApiProperty({
    description: '每页条数',
    example: 10
  })
  size!: number;

  @ApiProperty({
    description: '当前页码',
    example: 1
  })
  current!: number;

  @ApiProperty({
    description: '分页数据',
    type: [DictionaryItemResponseDto]
  })
  records!: DictionaryItemResponseDto[];
}
