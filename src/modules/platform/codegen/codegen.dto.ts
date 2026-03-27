import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CodegenTableListQueryDto {
  @ApiPropertyOptional({
    description: '表名或表注释关键字',
    example: '用户'
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
