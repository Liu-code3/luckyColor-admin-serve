import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class MenuListQueryDto {
  @Type(() => Number)
  @Min(1)
  page = 1;

  @Type(() => Number)
  @Min(1)
  size = 10;

  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @IsString()
  title!: string;

  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  type!: number;

  @IsString()
  path!: string;

  @IsString()
  menuKey!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @Type(() => Boolean)
  @IsBoolean()
  isVisible = true;

  @IsString()
  component!: string;

  @IsOptional()
  @IsString()
  redirect?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}

export class UpdateMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number | null;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  type?: number;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  menuKey?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  redirect?: string | null;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown> | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}
