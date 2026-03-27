import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { I18nResourcePullQueryDto } from './i18n.dto';
import { I18nResourcePullResponseDto } from './i18n.response.dto';
import { I18nService } from './i18n.service';

@ApiTags('平台能力 / 国际化资源')
@ApiServerErrorResponse()
@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @ApiOperation({
    summary: '拉取国际化资源',
    description:
      '按语言、模块和更新时间拉取已启用的国际化资源。'
  })
  @ApiQuery({
    name: 'languageCode',
    required: true,
    example: 'zh-CN',
    description: '语言编码'
  })
  @ApiQuery({
    name: 'module',
    required: false,
    example: 'auth',
    description: '模块过滤条件'
  })
  @ApiQuery({
    name: 'updatedAfter',
    required: false,
    example: '2026-03-25T00:00:00.000Z',
    description: '仅返回晚于该时间的资源'
  })
  @ApiSuccessResponse({
    type: I18nResourcePullResponseDto,
    description: '国际化资源拉取结果',
    dataExample: {
      languageCode: 'zh-CN',
      module: 'auth',
      version: 1,
      updatedAt: '2026-03-25T00:00:00.000Z',
      records: [
        {
          languageCode: 'zh-CN',
          module: 'auth',
          resourceGroup: 'login',
          resourceKey: 'title',
          resourceValue: '欢迎登录 LuckyColor',
          version: 1,
          status: true,
          updatedAt: '2026-03-25T00:00:00.000Z'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '拉取参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get('resources')
  pullResources(@Query() query: I18nResourcePullQueryDto) {
    return this.i18nService.pullResources(query);
  }
}
