import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfigItemResponseDto {
  @ApiProperty({
    description: '配置 ID',
    example: 'clxconfig1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '配置键',
    example: 'sys.default_locale'
  })
  configKey!: string;

  @ApiProperty({
    description: '配置名称',
    example: '默认语言'
  })
  configName!: string;

  @ApiProperty({
    description: '配置值',
    example: 'zh-CN'
  })
  configValue!: string;

  @ApiProperty({
    description: '值类型',
    example: 'string'
  })
  valueType!: string;

  @ApiPropertyOptional({
    description: '备注',
    example: '系统默认国际化语言',
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

export class ConfigPageResponseDto {
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
    type: [ConfigItemResponseDto]
  })
  records!: ConfigItemResponseDto[];
}
