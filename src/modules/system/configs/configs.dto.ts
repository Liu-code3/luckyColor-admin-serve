import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ConfigListQueryDto {
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
    description: '配置名称或配置键关键字',
    example: 'locale'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateConfigDto {
  @ApiProperty({
    description: '配置键',
    example: 'sys.default_locale'
  })
  @IsString()
  @IsNotEmpty()
  configKey!: string;

  @ApiProperty({
    description: '配置名称',
    example: '默认语言'
  })
  @IsString()
  @IsNotEmpty()
  configName!: string;

  @ApiProperty({
    description: '配置值',
    example: 'zh-CN'
  })
  @IsString()
  @IsNotEmpty()
  configValue!: string;

  @ApiPropertyOptional({
    description: '值类型',
    example: 'string',
    default: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: '备注',
    example: '系统默认国际化语言'
  })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateConfigDto {
  @ApiPropertyOptional({
    description: '配置键',
    example: 'sys.default_locale'
  })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({
    description: '配置名称',
    example: '默认语言'
  })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({
    description: '配置值',
    example: 'en-US'
  })
  @IsOptional()
  @IsString()
  configValue?: string;

  @ApiPropertyOptional({
    description: '值类型',
    example: 'string'
  })
  @IsOptional()
  @IsString()
  valueType?: string;

  @ApiPropertyOptional({
    description: '备注',
    example: '更新后的系统默认语言'
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
