import { ApiProperty } from '@nestjs/swagger';

export class SystemLogItemResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 'clxsyslog1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '租户 ID',
    example: 'tenant_001'
  })
  tenantId!: string;

  @ApiProperty({
    description: '操作人用户 ID',
    example: 'user_001'
  })
  operatorUserId!: string;

  @ApiProperty({
    description: '操作人',
    example: 'admin'
  })
  operatorName!: string;

  @ApiProperty({
    description: '日志模块',
    example: '用户管理'
  })
  module!: string;

  @ApiProperty({
    description: '日志内容',
    example: '删除了用户 admin-test'
  })
  content!: string;

  @ApiProperty({
    description: 'IP 地址',
    example: '127.0.0.1'
  })
  ipAddress!: string;

  @ApiProperty({
    description: '地区',
    example: '上海市'
  })
  region!: string;

  @ApiProperty({
    description: '浏览器版本',
    example: 'Chrome 123.0.0.0'
  })
  browserVersion!: string;

  @ApiProperty({
    description: '终端系统',
    example: 'Windows'
  })
  terminalSystem!: string;

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
    example: '2026-03-23T03:30:00.000Z'
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
    example: '2026-03-23T03:30:00.000Z'
  })
  updatedAt!: string;
}

export class SystemLogPageResponseDto {
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
    type: [SystemLogItemResponseDto]
  })
  records!: SystemLogItemResponseDto[];
}
