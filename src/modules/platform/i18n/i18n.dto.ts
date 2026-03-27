import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class I18nResourcePullQueryDto {
  @ApiProperty({
    description: '语言编码',
    example: 'zh-CN'
  })
  @IsString()
  languageCode!: string;

  @ApiPropertyOptional({
    description: '模块名称',
    example: 'auth'
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: '仅返回晚于该时间的记录',
    example: '2026-03-25T00:00:00.000Z'
  })
  @IsOptional()
  @Type(() => String)
  @IsDateString()
  updatedAfter?: string;
}
