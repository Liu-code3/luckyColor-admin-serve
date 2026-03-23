import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '登录用户名',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: '登录密码',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class AuthButtonPermissionQueryDto {
  @ApiPropertyOptional({
    description: '待校验的按钮权限码列表，支持逗号分隔或重复 query 传参',
    type: [String],
    example: ['system:user:create', 'system:user:update']
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  codes?: string[];
}
