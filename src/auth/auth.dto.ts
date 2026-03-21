import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class MenuListDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
