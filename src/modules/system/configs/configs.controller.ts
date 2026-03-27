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
import { SYSTEM_PERMISSION_POINTS } from '../../iam/permissions/permission-point-codes';
import {
  RequireMenuPermission,
  RequirePermissions
} from '../../iam/permissions/require-permissions.decorator';
import {
  ConfigBatchQueryDto,
  ConfigListQueryDto,
  CreateConfigDto,
  UpdateConfigDto
} from './configs.dto';
import {
  ConfigBatchResponseDto,
  ConfigCacheRefreshResponseDto,
  ConfigItemResponseDto,
  ConfigPageResponseDto,
  ConfigValueResponseDto
} from './configs.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { ConfigsService } from './configs.service';

@ApiTags('系统管理 / 系统配置')
@ApiServerErrorResponse()
@RequireMenuPermission('main_system_config')
@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @ApiOperation({
    summary: '系统配置分页列表',
    description:
      '按关键字、配置分组和状态分页查询系统配置。'
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
    example: '语言',
    description: '配置键或配置名称关键字'
  })
  @ApiQuery({
    name: 'configGroup',
    required: false,
    example: 'appearance',
    description: '配置分组'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '配置状态'
  })
  @ApiSuccessResponse({
    type: ConfigPageResponseDto,
    description: '系统配置分页结果',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'cfg_1',
          configKey: 'sys.default_locale',
          configName: '默认语言',
          configValue: 'zh-CN',
          configGroup: 'appearance',
          valueType: 'string',
          isBuiltIn: true,
          isSensitive: false,
          status: true,
          remark: '系统默认语言',
          createdAt: '2026-03-25T06:00:00.000Z',
          updatedAt: '2026-03-25T06:00:00.000Z'
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
    summary: '批量读取系统配置',
    description:
      '按配置键列表读取已启用配置，敏感值会被脱敏。'
  })
  @ApiQuery({
    name: 'keys',
    required: false,
    example: 'sys.default_locale,sys.enable_watermark',
    description: '配置键列表，支持逗号分隔'
  })
  @ApiSuccessResponse({
    type: ConfigBatchResponseDto,
    extraModels: [ConfigValueResponseDto],
    description: '批量读取配置结果',
    dataExample: {
      records: [
        {
          configKey: 'sys.default_locale',
          configName: '默认语言',
          configValue: 'zh-CN',
          configGroup: 'appearance',
          valueType: 'string',
          isBuiltIn: true,
          isSensitive: false,
          remark: '系统默认语言'
        },
        {
          configKey: 'sys.login.captcha_secret',
          configName: '验证码密钥',
          configValue: 'ca***mo',
          configGroup: 'login',
          valueType: 'string',
          isBuiltIn: true,
          isSensitive: true,
          remark: '登录页验证码使用'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '批量读取参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get('batch-read')
  readByKeys(@Query() query: ConfigBatchQueryDto) {
    return this.configsService.readByKeys(query);
  }

  @ApiOperation({
    summary: '系统配置详情',
    description:
      '根据配置 ID 查询详情，敏感值在响应中会被脱敏。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'cfg_1'
  })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '系统配置详情',
    dataExample: {
      id: 'cfg_1',
      configKey: 'sys.login.captcha_secret',
      configName: '验证码密钥',
      configValue: 'ca***mo',
      configGroup: 'login',
      valueType: 'string',
      isBuiltIn: true,
      isSensitive: true,
      status: true,
      remark: '登录页验证码使用',
      createdAt: '2026-03-25T06:00:00.000Z',
      updatedAt: '2026-03-25T06:00:00.000Z'
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
    summary: '创建系统配置',
    description: '创建一条系统配置记录。'
  })
  @ApiBody({ type: CreateConfigDto })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '创建后的系统配置',
    dataExample: {
      id: 'cfg_1',
      configKey: 'sys.default_locale',
      configName: '默认语言',
      configValue: 'zh-CN',
      configGroup: 'appearance',
      valueType: 'string',
      isBuiltIn: false,
      isSensitive: false,
      status: true,
      remark: '系统默认语言',
      createdAt: '2026-03-25T06:00:00.000Z',
      updatedAt: '2026-03-25T06:00:00.000Z'
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
    module: 'System Config',
    action: 'Create config',
    targets: [{ source: 'body', key: 'configKey', label: 'configKey' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.config.create)
  @Post()
  create(@Body() dto: CreateConfigDto) {
    return this.configsService.create(dto);
  }

  @ApiOperation({
    summary: '刷新系统配置缓存',
    description: '重建已启用系统配置的缓存数据。'
  })
  @ApiSuccessResponse({
    type: ConfigCacheRefreshResponseDto,
    description: '配置缓存刷新结果',
    dataExample: {
      cacheKey: 'system:configs:cache',
      count: 4,
      refreshedAt: '2026-03-25T06:00:00.000Z'
    }
  })
  @SystemLog({
    module: 'System Config',
    action: 'Refresh config cache'
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.config.refreshCache)
  @Post('refresh-cache')
  refreshCache() {
    return this.configsService.refreshCache();
  }

  @ApiOperation({
    summary: '更新系统配置',
    description:
      '更新系统配置，并在变更生效后刷新缓存。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'cfg_1'
  })
  @ApiBody({ type: UpdateConfigDto })
  @ApiSuccessResponse({
    type: ConfigItemResponseDto,
    description: '更新后的系统配置',
    dataExample: {
      id: 'cfg_1',
      configKey: 'sys.default_locale',
      configName: '默认语言',
      configValue: 'en-US',
      configGroup: 'appearance',
      valueType: 'string',
      isBuiltIn: true,
      isSensitive: false,
      status: true,
      remark: '已更新语言配置',
      createdAt: '2026-03-25T06:00:00.000Z',
      updatedAt: '2026-03-25T07:00:00.000Z'
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
    module: 'System Config',
    action: 'Update config',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'configKey', label: 'configKey' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.config.update)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configsService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除系统配置',
    description:
      '删除系统配置记录，并在删除后刷新缓存。'
  })
  @ApiParam({
    name: 'id',
    description: '配置 ID',
    example: 'cfg_1'
  })
  @ApiSuccessResponse({
    description: '删除结果',
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
    module: 'System Config',
    action: 'Delete config',
    targets: [{ source: 'param', key: 'id', label: 'id' }],
    sensitive: true
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.config.delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configsService.remove(id);
  }
}
