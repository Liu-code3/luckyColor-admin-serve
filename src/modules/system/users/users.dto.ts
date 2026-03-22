import { randomUUID } from 'node:crypto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UserListQueryDto {
  @Type(() => Number)
  @Min(1)
  page = 1;

  @Type(() => Number)
  @Min(1)
  size = 10;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  token?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  token?: string;
}

export function createUserToken(token?: string) {
  return token?.trim() || randomUUID().replace(/-/g, '');
}
