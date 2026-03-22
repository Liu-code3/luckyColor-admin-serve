import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class ConfigListQueryDto {
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
    description: 'keyword for config name or key',
    example: 'locale'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateConfigDto {
  @ApiProperty({
    description: 'config key',
    example: 'sys.default_locale'
  })
  @IsString()
  @IsNotEmpty()
  configKey!: string;

  @ApiProperty({
    description: 'config name',
    example: '默认语言'
  })
  @IsString()
  @IsNotEmpty()
  configName!: string;

  @ApiProperty({
    description: 'config value',
    example: 'zh-CN'
  })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({
    description: 'value type',
    example: 'string',
    default: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: 'status, true for enabled and false for disabled',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'remark',
    example: '系统默认国际化语言'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({
    description: 'config key',
    example: 'sys.default_locale'
  })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({
    description: 'config name',
    example: '默认语言'
  })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({
    description: 'config value',
    example: 'en-US'
  })
  @IsOptional()
  @IsString()
  configValue?: string;

  @ApiPropertyOptional({
    description: 'value type',
    example: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: 'status, true for enabled and false for disabled',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'remark',
    example: '更新后的系统默认语言'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
