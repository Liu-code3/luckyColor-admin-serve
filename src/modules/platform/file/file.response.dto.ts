import { ApiProperty } from '@nestjs/swagger';

export class UploadFileBodyDto {
  @ApiProperty({
    description: '待上传文件',
    type: 'string',
    format: 'binary'
  })
  file!: unknown;
}

export class UploadedFileResponseDto {
  @ApiProperty({
    description: '原始文件名',
    example: 'avatar.png'
  })
  name!: string;

  @ApiProperty({
    description: '服务器保存文件名',
    example: '1711096800000-avatar.png'
  })
  filename!: string;

  @ApiProperty({
    description: '公开访问地址',
    example: '/api/file/1711096800000-avatar.png'
  })
  url!: string;
}
