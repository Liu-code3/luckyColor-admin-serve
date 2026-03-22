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
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { successResponse } from '../../../shared/api/api-response';
import { ApiSuccessResponse } from '../../../shared/swagger/swagger-response';
import { FileService } from './file.service';
import { UploadedFileResponseDto, UploadFileBodyDto } from './file.response.dto';

@ApiTags('平台能力 / 文件服务')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({
    summary: '上传文件',
    description: '上传文件并返回可访问地址。'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileBodyDto })
  @ApiSuccessResponse({
    type: UploadedFileResponseDto,
    description: '文件上传成功响应',
    dataExample: {
      name: 'avatar.png',
      filename: '1711096800000-avatar.png',
      url: '/api/file/1711096800000-avatar.png'
    }
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: { originalname: string; buffer: Buffer }) {
    return successResponse(await this.fileService.saveUploadedFile(file));
  }

  @ApiOperation({
    summary: '删除文件',
    description: '根据文件访问地址或文件名删除文件。'
  })
  @ApiQuery({
    name: 'filePath',
    required: true,
    description: '文件地址或文件名',
    example: '/api/file/1711096800000-avatar.png'
  })
  @ApiSuccessResponse({
    description: '文件删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @Get('delete')
  async delete(@Query('filePath') filePath: string) {
    return successResponse(await this.fileService.deleteByPath(filePath));
  }

  @ApiOperation({
    summary: '读取文件',
    description: '根据文件名访问已上传文件。'
  })
  @ApiParam({
    name: 'filename',
    description: '文件名',
    example: '1711096800000-avatar.png'
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: '文件二进制流',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @Get(':filename')
  async read(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: any
  ) {
    const filePath = await this.fileService.resolveFilePath(filename);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`
    );
    return new StreamableFile(createReadStream(filePath));
  }
}
