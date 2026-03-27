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
    description: '配置值，敏感配置会被脱敏',
    example: 'zh-CN'
  })
  configValue!: string;

  @ApiProperty({
    description: '配置分组',
    example: 'appearance'
  })
  configGroup!: string;

  @ApiProperty({
    description: '值类型',
    example: 'string'
  })
  valueType!: string;

  @ApiProperty({
    description: '是否内置配置',
    example: false
  })
  isBuiltIn!: boolean;

  @ApiProperty({
    description: '是否敏感配置',
    example: false
  })
  isSensitive!: boolean;

  @ApiProperty({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '系统默认语言',
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

export class ConfigValueResponseDto {
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
    description: '配置值，敏感配置会被脱敏',
    example: 'zh-CN'
  })
  configValue!: string;

  @ApiProperty({
    description: '配置分组',
    example: 'appearance'
  })
  configGroup!: string;

  @ApiProperty({
    description: '值类型',
    example: 'string'
  })
  valueType!: string;

  @ApiProperty({
    description: '是否内置配置',
    example: true
  })
  isBuiltIn!: boolean;

  @ApiProperty({
    description: '是否敏感配置',
    example: false
  })
  isSensitive!: boolean;

  @ApiPropertyOptional({
    description: '备注',
    example: '系统默认语言',
    nullable: true
  })
  remark?: string | null;
}

export class ConfigBatchResponseDto {
  @ApiProperty({
    description: '匹配到的配置记录',
    type: [ConfigValueResponseDto]
  })
  records!: ConfigValueResponseDto[];
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
    description: '当前页记录',
    type: [ConfigItemResponseDto]
  })
  records!: ConfigItemResponseDto[];
}

export class ConfigCacheRefreshResponseDto {
  @ApiProperty({
    description: '系统配置缓存键',
    example: 'system:configs:cache'
  })
  cacheKey!: string;

  @ApiProperty({
    description: '写入缓存的启用配置数量',
    example: 3
  })
  count!: number;

  @ApiProperty({
    description: '缓存刷新时间',
    format: 'date-time',
    example: '2026-03-22T16:00:00.000Z'
  })
  refreshedAt!: string;
}
