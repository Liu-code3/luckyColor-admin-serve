import { ApiProperty } from '@nestjs/swagger';

export class DictionaryCacheRefreshResponseDto {
  @ApiProperty({
    description: '缓存键',
    example: 'system:dictionaries:tree:tenant_001'
  })
  cacheKey!: string;

  @ApiProperty({
    description: '写入缓存的字典节点数量',
    example: 18
  })
  count!: number;

  @ApiProperty({
    description: '缓存刷新时间',
    format: 'date-time',
    example: '2026-03-24T10:00:00.000Z'
  })
  refreshedAt!: string;
}
