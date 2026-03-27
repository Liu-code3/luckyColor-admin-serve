import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserTabPreferencesResponseDto {
  @ApiProperty({
    description: '是否启用标签页',
    example: true
  })
  enabled!: boolean;

  @ApiProperty({
    description: '刷新后是否恢复标签页',
    example: true
  })
  persist!: boolean;

  @ApiProperty({
    description: '标签页是否显示图标',
    example: true
  })
  showIcon!: boolean;

  @ApiProperty({
    description: '标签页是否允许拖拽排序',
    example: true
  })
  draggable!: boolean;
}

export class CurrentUserPreferenceResponseDto {
  @ApiProperty({
    description: '当前用户 ID',
    example: 'clxuser1234567890'
  })
  userId!: string;

  @ApiProperty({
    description: '布局模式',
    example: 'side'
  })
  layout!: string;

  @ApiProperty({
    description: '主题标识或预设名称',
    example: 'default'
  })
  theme!: string;

  @ApiProperty({
    description: '是否启用暗黑模式',
    example: false
  })
  darkMode!: boolean;

  @ApiProperty({
    description: '是否默认全屏显示',
    example: false
  })
  fullscreen!: boolean;

  @ApiProperty({
    description: '标签页偏好设置',
    type: UserTabPreferencesResponseDto
  })
  tabPreferences!: UserTabPreferencesResponseDto;

  @ApiPropertyOptional({
    description: '首次保存时间',
    format: 'date-time',
    nullable: true,
    example: '2026-03-25T08:00:00.000Z'
  })
  createdAt?: string | null;

  @ApiPropertyOptional({
    description: '最后更新时间',
    format: 'date-time',
    nullable: true,
    example: '2026-03-25T08:30:00.000Z'
  })
  updatedAt?: string | null;
}
