import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
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

export class DictionaryItemListQueryDto {
  @ApiProperty({
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  @IsString()
  typeId!: string;

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
    description: '字典项名称、标签或编码关键字',
    example: '启用'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '状态，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;
}

export class DictionaryItemTreeQueryDto {
  @ApiProperty({
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  @IsString()
  typeId!: string;

  @ApiPropertyOptional({
    description: '状态筛选，true 为启用，false 为停用',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  status?: boolean;
}

export class UpdateDictionaryItemStatusDto {
  @ApiProperty({
    description: '状态，true 为启用，false 为停用；停用时会级联停用全部子项',
    example: true
  })
  @Type(() => Boolean)
  @IsBoolean()
  status!: boolean;
}

export class DictionaryItemSortDto {
  @ApiProperty({
    description: '排序值',
    example: 200
  })
  @Type(() => Number)
  @IsInt()
  sortCode!: number;
}
