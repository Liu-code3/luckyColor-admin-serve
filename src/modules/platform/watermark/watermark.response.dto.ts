import { ApiProperty } from '@nestjs/swagger';

export class CurrentVisibleWatermarkResponseDto {
  @ApiProperty({
    description: '当前用户是否启用水印',
    example: true
  })
  enabled!: boolean;

  @ApiProperty({
    description: '最终生效的水印内容',
    example: 'LuckyColor 管理后台'
  })
  content!: string;

  @ApiProperty({
    description: '最终生效的水印透明度',
    example: 0.15
  })
  opacity!: number;

  @ApiProperty({
    description: '最终生效的水印颜色',
    example: '#1f2937'
  })
  color!: string;

  @ApiProperty({
    description: '最终生效的水印字号',
    example: 16
  })
  fontSize!: number;

  @ApiProperty({
    description: '最终生效的水印旋转角度',
    example: -22
  })
  rotation!: number;

  @ApiProperty({
    description: '最终水印结果来源层级',
    example: 'TENANT'
  })
  source!: string;
}
