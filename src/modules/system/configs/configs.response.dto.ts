import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfigItemResponseDto {
  @ApiProperty({
    description: 'config id',
    example: 'clxconfig1234567890'
  })
  id!: string;

  @ApiProperty({
    description: 'config key',
    example: 'sys.default_locale'
  })
  configKey!: string;

  @ApiProperty({
    description: 'config name',
    example: '默认语言'
  })
  configName!: string;

  @ApiProperty({
    description: 'config value',
    example: 'zh-CN'
  })
  configValue!: string;

  @ApiProperty({
    description: 'value type',
    example: 'string'
  })
  valueType!: string;

  @ApiProperty({
    description: 'status, true for enabled and false for disabled',
    example: true
  })
  status!: boolean;

  @ApiPropertyOptional({
    description: 'remark',
    example: '系统默认国际化语言',
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

export class ConfigPageResponseDto {
  @ApiProperty({
    description: 'total records',
    example: 3
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
    type: [ConfigItemResponseDto]
  })
  records!: ConfigItemResponseDto[];
}

export class ConfigCacheRefreshResponseDto {
  @ApiProperty({
    description: 'redis cache key',
    example: 'system:configs:cache'
  })
  cacheKey!: string;

  @ApiProperty({
    description: 'enabled config count written into cache',
    example: 3
  })
  count!: number;

  @ApiProperty({
    description: 'cache refresh time',
    format: 'date-time',
    example: '2026-03-22T16:00:00.000Z'
  })
  refreshedAt!: string;
}
