import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { successResponse } from '../../../shared/api/api-response';
import { FileService } from './file.service';

@ApiTags('平台能力 / 文件服务')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({
    summary: '上传文件',
    description: '上传文件并返回可访问地址'
  })
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: { originalname: string; buffer: Buffer }) {
    return successResponse(await this.fileService.saveUploadedFile(file), '上传文件成功');
  }

  @ApiOperation({
    summary: '删除文件',
    description: '根据文件访问地址或文件名删除文件'
  })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: '文件地址或文件名'
  })
  @Get('delete')
  async delete(@Query('filePath') filePath: string) {
    return successResponse(await this.fileService.deleteByPath(filePath), '删除文件成功');
  }

  @ApiOperation({
    summary: '访问文件',
    description: '根据文件名访问已上传文件'
  })
  @Get(':filename')
  async read(@Param('filename') filename: string, @Res({ passthrough: true }) response: any) {
    const filePath = await this.fileService.resolveFilePath(filename);
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    return new StreamableFile(createReadStream(filePath));
  }
}
