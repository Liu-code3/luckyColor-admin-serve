import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches
} from 'class-validator';

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

  @ApiPropertyOptional({
    description: '验证码校验成功后换取的一次性登录令牌',
    example: 'cap_01JQ8J6K4SZQ7X6MEY9R2QG3TN'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  captchaToken?: string;
}

export class VerifyLoginCaptchaDto {
  @ApiProperty({
    description: '验证码题目 ID',
    example: 'cpt_01JQ8J4S9P4X1N5P4D2M8E7T0A'
  })
  @IsString()
  @IsNotEmpty()
  captchaId!: string;

  @ApiProperty({
    description: '算术题计算结果',
    example: '13'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^-?\d+$/, {
    message: 'answer must be an integer string'
  })
  answer!: string;
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
