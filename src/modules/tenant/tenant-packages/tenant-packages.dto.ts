import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Min } from 'class-validator';

export class TenantPackageListQueryDto {
  @ApiPropertyOptional({
    description: 'page number',
    example: 1,
    default: 1
  })
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'page size',
    example: 10,
    default: 10
  })
  @Type(() => Number)
  @Min(1)
  size = 10;

  @ApiPropertyOptional({
    description: 'keyword for package name or code',
    example: 'basic'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'package status',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;
}
