import { randomUUID } from 'node:crypto';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UserListQueryDto {
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
    description: '用户名或昵称关键字',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: '密码',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    description: '昵称',
    example: '系统管理员'
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: '登录 token，不传则自动生成',
    example: '8f9c8dbf9bbf4ce7a707e8a0937f4db0'
  })
  @IsOptional()
  @IsString()
  token?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '用户名',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: '密码',
    example: '654321'
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: '昵称',
    example: '管理员'
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: '登录 token',
    example: 'd6c3fe120bb24da88f6b6d44d90fd8fa'
  })
  @IsOptional()
  @IsString()
  token?: string;
}

export function createUserToken(token?: string) {
  return token?.trim() || randomUUID().replace(/-/g, '');
}
