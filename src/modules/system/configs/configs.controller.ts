import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { RequirePermissions } from '../../iam/permissions/require-permissions.decorator';
import {
  ConfigListQueryDto,
  CreateConfigDto,
  UpdateConfigDto
} from './configs.dto';
import {
  ConfigCacheRefreshResponseDto,
  ConfigItemResponseDto,
  ConfigPageResponseDto
} from './configs.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { ConfigsService } from './configs.service';

@ApiTags('系统管理 / 系统配置')
@ApiServerErrorResponse()
@RequirePermissions('main_system_config')
@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @ApiOperation({
    summary: '配置分页列表',
    description: '分页查询系统配置，支持配置名称或配置键关键字筛选。'
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: 'locale',
    description: '配置名称或配置键关键字'
  })
  @ApiSuccessResponse({
    type: ConfigPageResponseDto,
    description: '配置分页列表响应',
    dataExample: {
      total: 3,
      current: 1,
      size: 10,
      records: [
        {
          id: 'clxconfig1234567890',
          configKey: 'sys.default_locale',
          configName: '默认语言',
          configValue: 'zh-CN',
          valueType: 'string',
          status: true,
          remark: '系统默认国际化语言',
          createdAt: '2026-03-22T14:30:00.000Z',
          updatedAt: '2026-03-22T14:30:00.000Z'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '分页参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get()
  list(@Query() query: ConfigListQueryDto) {
    return this.configsService.list(query);
  }

  @ApiOperation({
    summary: '配置详情',
    description: '根据配置 ID 查询配置详情。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'clxconfig1234567890'
  })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '配置详情响应',
    dataExample: {
      id: 'clxconfig1234567890',
      configKey: 'sys.default_locale',
      configName: '默认语言',
      configValue: 'zh-CN',
      valueType: 'string',
      status: true,
      remark: '系统默认国际化语言',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '系统配置不存在',
    examples: [
      {
        name: 'configNotFound',
        code: BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.configsService.detail(id);
  }

  @ApiOperation({
    summary: '创建配置',
    description: '新增系统配置项。'
  })
  @ApiBody({ type: CreateConfigDto })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '配置创建成功响应',
    dataExample: {
      id: 'clxconfig1234567890',
      configKey: 'sys.default_locale',
      configName: '默认语言',
      configValue: 'zh-CN',
      valueType: 'string',
      status: true,
      remark: '系统默认国际化语言',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 409,
    description: '配置键已存在',
    examples: [
      {
        name: 'configKeyExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '创建参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '系统配置',
    action: '创建配置',
    targets: [{ source: 'body', key: 'configKey', label: 'configKey' }]
  })
  @Post()
  create(@Body() dto: CreateConfigDto) {
    return this.configsService.create(dto);
  }

  @ApiOperation({
    summary: '刷新配置缓存',
    description: '将当前启用的系统配置重新写入 Redis 缓存。'
  })
  @ApiSuccessResponse({
    type: ConfigCacheRefreshResponseDto,
    description: '配置缓存刷新结果',
    dataExample: {
      cacheKey: 'system:configs:cache',
      count: 3,
      refreshedAt: '2026-03-22T16:00:00.000Z'
    }
  })
  @SystemLog({
    module: '系统配置',
    action: '刷新配置缓存'
  })
  @Post('refresh-cache')
  refreshCache() {
    return this.configsService.refreshCache();
  }

  @ApiOperation({
    summary: '更新配置',
    description: '根据配置 ID 更新系统配置。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'clxconfig1234567890'
  })
  @ApiBody({ type: UpdateConfigDto })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '配置更新成功响应',
    dataExample: {
      id: 'clxconfig1234567890',
      configKey: 'sys.default_locale',
      configName: '默认语言',
      configValue: 'en-US',
      valueType: 'string',
      status: false,
      remark: '更新后的系统默认语言',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '系统配置不存在',
    examples: [
      {
        name: 'configNotFound',
        code: BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '配置键已存在',
    examples: [
      {
        name: 'configKeyExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '更新参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '系统配置',
    action: '更新配置',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'configKey', label: 'configKey' }
    ]
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configsService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除配置',
    description: '根据配置 ID 删除系统配置。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'clxconfig1234567890'
  })
  @ApiSuccessResponse({
    description: '配置删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '系统配置不存在',
    examples: [
      {
        name: 'configNotFound',
        code: BUSINESS_ERROR_CODES.CONFIG_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '系统配置',
    action: '删除配置',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configsService.remove(id);
  }
}
