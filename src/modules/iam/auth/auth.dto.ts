import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '登录账号',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @ApiProperty({
    description: '登录密码',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class MenuListDto {
  @ApiProperty({
    description: '旧版登录态 token',
    example: '8f9c8dbf9bbf4ce7a707e8a0937f4db0'
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
