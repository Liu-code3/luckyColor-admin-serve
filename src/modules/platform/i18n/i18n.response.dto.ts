import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class I18nResourceItemResponseDto {
  @ApiProperty({
    description: '语言编码',
    example: 'zh-CN'
  })
  languageCode!: string;

  @ApiProperty({
    description: '模块名称',
    example: 'auth'
  })
  module!: string;

  @ApiProperty({
    description: '资源分组',
    example: 'login'
  })
  resourceGroup!: string;

  @ApiProperty({
    description: '资源键名',
    example: 'title'
  })
  resourceKey!: string;

  @ApiProperty({
    description: '资源值',
    example: '欢迎登录 LuckyColor'
  })
  resourceValue!: string;

  @ApiProperty({
    description: '资源版本号',
    example: 1
  })
  version!: number;

  @ApiProperty({
    description: '资源状态',
    example: true
  })
  status!: boolean;

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
    example: '2026-03-25T00:00:00.000Z'
  })
  updatedAt!: string;
}

export class I18nResourcePullResponseDto {
  @ApiProperty({
    description: '语言编码',
    example: 'zh-CN'
  })
  languageCode!: string;

  @ApiPropertyOptional({
    description: '模块过滤条件',
    example: 'auth',
    nullable: true
  })
  module?: string | null;

  @ApiProperty({
    description: '当前结果集中的最新版本号',
    example: 2
  })
  version!: number;

  @ApiPropertyOptional({
    description: '当前结果集中的最新更新时间',
    format: 'date-time',
    example: '2026-03-25T00:00:00.000Z',
    nullable: true
  })
  updatedAt!: string | null;

  @ApiProperty({
    description: '资源记录列表',
    type: [I18nResourceItemResponseDto]
  })
  records!: I18nResourceItemResponseDto[];
}
