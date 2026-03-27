import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

function transformBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

export class TabPreferencesDto {
  @ApiPropertyOptional({
    description: '是否启用标签页',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: '刷新后是否恢复标签页',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  persist?: boolean;

  @ApiPropertyOptional({
    description: '标签页是否显示图标',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  showIcon?: boolean;

  @ApiPropertyOptional({
    description: '标签页是否允许拖拽排序',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  draggable?: boolean;
}

export class SaveUserPreferencesDto {
  @ApiPropertyOptional({
    description: '布局模式',
    example: 'side'
  })
  @IsOptional()
  @IsString()
  layout?: string;

  @ApiPropertyOptional({
    description: '主题标识或预设名称',
    example: 'default'
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({
    description: '是否启用暗黑模式',
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  darkMode?: boolean;

  @ApiPropertyOptional({
    description: '是否默认全屏显示',
    example: false
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  fullscreen?: boolean;

  @ApiPropertyOptional({
    description: '标签页偏好设置',
    type: TabPreferencesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TabPreferencesDto)
  tabPreferences?: TabPreferencesDto;
}
