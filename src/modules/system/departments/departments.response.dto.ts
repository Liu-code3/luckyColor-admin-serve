import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentItemResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '父级部门 ID，根节点为 0',
    example: 0
  })
  pid!: number;

  @ApiProperty({
    description: '部门 ID',
    example: 110
  })
  id!: number;

  @ApiProperty({
    description: '部门名称',
    example: '产品研发部'
  })
  name!: string;

  @ApiProperty({
    description: '部门编码',
    example: 'product_rd'
  })
  code!: string;

  @ApiPropertyOptional({
    description: '负责人',
    example: '李工',
    nullable: true
  })
  leader?: string | null;

  @ApiPropertyOptional({
    description: '联系电话',
    example: '13800000001',
    nullable: true
  })
  phone?: string | null;

  @ApiPropertyOptional({
    description: '联系邮箱',
    example: 'rd@luckycolor.local',
    nullable: true
  })
  email?: string | null;

  @ApiProperty({
    description: '排序值',
    example: 10
  })
  sort!: number;

  @ApiProperty({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '负责产品设计与技术研发',
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

export class DepartmentTreeItemResponseDto extends DepartmentItemResponseDto {
  @ApiPropertyOptional({
    description: '子级部门节点',
    type: () => [DepartmentTreeItemResponseDto]
  })
  children?: DepartmentTreeItemResponseDto[];
}

export class DepartmentPageResponseDto {
  @ApiProperty({
    description: '总记录数',
    example: 3
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
    type: [DepartmentItemResponseDto]
  })
  records!: DepartmentItemResponseDto[];
}
