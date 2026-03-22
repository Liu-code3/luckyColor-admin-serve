import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({
    description: '用户 ID',
    example: 'clx1234567890'
  })
  id!: string;

  @ApiProperty({
    description: '用户名',
    example: 'admin'
  })
  username!: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: '系统管理员',
    nullable: true
  })
  nickname?: string | null;
}

export class LoginResultResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature'
  })
  accessToken!: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer'
  })
  tokenType!: string;

  @ApiProperty({
    description: '过期时间配置',
    example: '2h'
  })
  expiresIn!: string;

  @ApiProperty({
    description: '当前登录用户信息',
    type: AuthUserResponseDto
  })
  user!: AuthUserResponseDto;
}
