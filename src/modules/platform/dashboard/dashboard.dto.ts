import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackDashboardVisitDto {
  @ApiProperty({
    description: 'visitor id from frontend local storage',
    example: 'xn7f2f37d0-8c0a-4b4c-a6fc-120f3d0f8c9d'
  })
  @IsString()
  @MaxLength(191)
  visitorId!: string;

  @ApiProperty({
    description: 'browser session id from session storage',
    example: 'xn8f3a1ab5-75ac-4c1d-9151-2c9b3836c212'
  })
  @IsString()
  @MaxLength(191)
  sessionId!: string;

  @ApiProperty({
    description: 'current route path',
    example: '/systemManagement/system/users'
  })
  @IsString()
  @MaxLength(191)
  routePath!: string;

  @ApiProperty({
    description: 'current route title',
    example: '用户管理'
  })
  @IsString()
  @MaxLength(191)
  routeTitle!: string;

  @ApiPropertyOptional({
    description: 'current route icon',
    example: 'solar:users-group-rounded-linear',
    nullable: true
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  routeIcon?: string | null;
}
