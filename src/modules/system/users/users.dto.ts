import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

function transformBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

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
    description: '用户名、昵称、手机号或邮箱关键字',
    example: 'admin'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '用户状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '所属部门 ID',
    example: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    description: '创建时间开始',
    example: '2026-03-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  createdAtStart?: string;

  @ApiPropertyOptional({
    description: '创建时间结束',
    example: '2026-03-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  createdAtEnd?: string;
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
    description: '用户昵称',
    example: '系统管理员'
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: '手机号',
    example: '13800000000',
    nullable: true
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description: '邮箱',
    example: 'admin@luckycolor.local',
    nullable: true
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: '头像地址',
    example: 'https://static.luckycolor.local/avatar/admin.png',
    nullable: true
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({
    description: '用户状态，true 为启用，false 为停用',
    example: true,
    default: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '所属部门 ID',
    example: 100,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number | null;
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
    description: '用户昵称，传 null 表示清空',
    example: '管理员',
    nullable: true
  })
  @IsOptional()
  @IsString()
  nickname?: string | null;

  @ApiPropertyOptional({
    description: '手机号，传 null 表示清空',
    example: '13800000001',
    nullable: true
  })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional({
    description: '邮箱，传 null 表示清空',
    example: 'admin-updated@luckycolor.local',
    nullable: true
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: '头像地址，传 null 表示清空',
    example: 'https://static.luckycolor.local/avatar/admin-updated.png',
    nullable: true
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({
    description: '用户状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: '所属部门 ID，传 null 表示清空',
    example: 120,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number | null;
}

export class AssignUserRolesDto {
  @ApiProperty({
    description: '角色 ID 列表，传空数组表示清空当前用户全部角色',
    example: ['clxrole1234567890', 'clxrole0987654321']
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleIds!: string[];
}
