import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Min } from 'class-validator';

export class NoticeListQueryDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    default: 1
  })
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: '每页条数',
    example: 10,
    default: 10
  })
  @Type(() => Number)
  @Min(1)
  size = 10;

  @ApiPropertyOptional({
    description: '公告标题关键字',
    example: '更新'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateNoticeDto {
  @ApiProperty({
    description: '公告标题',
    example: '版本更新提醒'
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: '公告内容',
    example: '本周将上线多租户配置中心，请提前关注菜单与权限变更。'
  })
  @IsString()
  content!: string;

  @ApiProperty({
    description: '公告类型',
    example: 'release'
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    description: '发布状态，true 已发布，false 草稿',
    example: false,
    default: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队'
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({
    description: '发布时间',
    example: '2026-03-22T08:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  publishedAt?: string;
}

export class UpdateNoticeDto {
  @ApiPropertyOptional({
    description: '公告标题',
    example: '版本更新提醒'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '公告内容',
    example: '更新后的公告内容'
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '公告类型',
    example: 'release'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: '发布状态，true 已发布，false 草稿',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '发布人',
    example: '产品团队'
  })
  @IsOptional()
  @IsString()
  publisher?: string | null;

  @ApiPropertyOptional({
    description: '发布时间',
    example: '2026-03-22T10:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  publishedAt?: string | null;
}
