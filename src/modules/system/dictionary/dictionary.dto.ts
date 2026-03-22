import { randomUUID } from 'node:crypto';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class DictionaryPageQueryDto {
  @Type(() => Number)
  @Min(1)
  page = 1;

  @Type(() => Number)
  @Min(1)
  size = 10;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  searchKey?: string;
}

export class CreateDictionaryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @Type(() => Number)
  @IsInt()
  weight!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  dictLabel!: string;

  @IsString()
  @IsNotEmpty()
  dictValue!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @Type(() => Number)
  @IsInt()
  sortCode!: number;

  @IsString()
  @IsNotEmpty()
  deleteFlag!: string;

  @IsOptional()
  @IsString()
  createTime?: string;

  @IsOptional()
  @IsString()
  createUser?: string;

  @IsOptional()
  @IsString()
  updateTime?: string;

  @IsOptional()
  @IsString()
  updateUser?: string;
}

export class UpdateDictionaryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  dictLabel?: string;

  @IsOptional()
  @IsString()
  dictValue?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortCode?: number;

  @IsOptional()
  @IsString()
  deleteFlag?: string;

  @IsOptional()
  @IsString()
  createTime?: string;

  @IsOptional()
  @IsString()
  createUser?: string;

  @IsOptional()
  @IsString()
  updateTime?: string;

  @IsOptional()
  @IsString()
  updateUser?: string;
}

export function createDictionaryId(id?: string) {
  return id?.trim() || randomUUID().replace(/-/g, '');
}
