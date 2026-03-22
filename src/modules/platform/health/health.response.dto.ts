import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusResponseDto {
  @ApiProperty({
    description: '服务状态',
    example: 'ok'
  })
  status!: string;

  @ApiProperty({
    description: '检测时间',
    format: 'date-time',
    example: '2026-03-22T14:30:00.000Z'
  })
  timestamp!: string;

  @ApiProperty({
    description: '数据库连接状态',
    example: 'up'
  })
  database!: string;
}
