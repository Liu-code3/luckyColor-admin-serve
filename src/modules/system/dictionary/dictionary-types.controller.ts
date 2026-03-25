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
import { SystemLog } from '../system-logs/system-log.decorator';
import {
  CreateDictionaryTypeDto,
  DictionaryTypeListQueryDto,
  UpdateDictionaryTypeDto
} from './dictionary-types.dto';
import {
  DictionaryTypeItemResponseDto,
  DictionaryTypePageResponseDto
} from './dictionary-types.response.dto';
import { DictionaryTypesService } from './dictionary-types.service';

@ApiTags('系统管理 / 字典类型')
@ApiServerErrorResponse()
@RequireMenuPermission('icomponent_dict')
@Controller('dict/types')
export class DictionaryTypesController {
  constructor(
    private readonly dictionaryTypesService: DictionaryTypesService
  ) {}

  @ApiOperation({
    summary: '字典类型分页列表',
    description: '分页查询字典类型，支持按类型名称、标签、编码或分类筛选。'
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
    example: '状态',
    description: '字典类型名称、标签或编码关键字'
  })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'FRM',
    description: '字典分类'
  })
  @ApiSuccessResponse({
    type: DictionaryTypePageResponseDto,
    description: '字典类型分页列表响应',
    dataExample: {
      total: 2,
      current: 1,
      size: 10,
      records: [
        {
          id: 'dict_common_status',
          name: '系统通用状态',
          tenantId: 'tenant_001',
          dictLabel: '系统通用状态',
          dictValue: 'COMMON_STATUS',
          category: 'FRM',
          weight: 10,
          sortCode: 100,
          deleteFlag: 'NOT_DELETE',
          createTime: '2026-03-22 10:00:00',
          createUser: 'admin',
          updateTime: '2026-03-22 10:00:00',
          updateUser: 'admin',
          createdAt: '2026-03-22T10:00:00.000Z',
          updatedAt: '2026-03-22T10:00:00.000Z'
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
  list(@Query() query: DictionaryTypeListQueryDto) {
    return this.dictionaryTypesService.list(query);
  }

  @ApiOperation({
    summary: '字典类型详情',
    description: '根据字典类型 ID 查询根节点详情。'
  })
  @ApiParam({
    name: 'id',
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  @ApiSuccessResponse({
    type: DictionaryTypeItemResponseDto,
    description: '字典类型详情响应',
    dataExample: {
      id: 'dict_common_status',
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'FRM',
      weight: 10,
      sortCode: 100,
      deleteFlag: 'NOT_DELETE',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin',
      createdAt: '2026-03-22T10:00:00.000Z',
      updatedAt: '2026-03-22T10:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典类型不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.dictionaryTypesService.detail(id);
  }

  @ApiOperation({
    summary: '创建字典类型',
    description: '新增字典类型根节点，不允许写入父节点。'
  })
  @ApiBody({ type: CreateDictionaryTypeDto })
  @ApiSuccessResponse({
    type: DictionaryTypeItemResponseDto,
    description: '字典类型创建成功响应',
    dataExample: {
      id: 'dict_common_status',
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'FRM',
      weight: 10,
      sortCode: 100,
      deleteFlag: 'NOT_DELETE',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin',
      createdAt: '2026-03-22T10:00:00.000Z',
      updatedAt: '2026-03-22T10:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 409,
    description: '字典类型编码已存在',
    examples: [
      {
        name: 'dictionaryTypeCodeExists',
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
    module: '字典类型',
    action: '创建字典类型',
    targets: [{ source: 'body', key: 'dictValue', label: 'dictValue' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.dictionaryType.create)
  @Post()
  create(@Body() dto: CreateDictionaryTypeDto) {
    return this.dictionaryTypesService.createType(dto);
  }

  @ApiOperation({
    summary: '更新字典类型',
    description: '根据字典类型 ID 更新根节点信息。'
  })
  @ApiParam({
    name: 'id',
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  @ApiBody({ type: UpdateDictionaryTypeDto })
  @ApiSuccessResponse({
    type: DictionaryTypeItemResponseDto,
    description: '字典类型更新成功响应',
    dataExample: {
      id: 'dict_common_status',
      name: '系统通用状态',
      tenantId: 'tenant_001',
      dictLabel: '系统通用状态',
      dictValue: 'COMMON_STATUS',
      category: 'BIZ',
      weight: 20,
      sortCode: 200,
      deleteFlag: 'NOT_DELETE',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 11:00:00',
      updateUser: 'admin',
      createdAt: '2026-03-22T10:00:00.000Z',
      updatedAt: '2026-03-22T11:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典类型不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '字典类型编码已存在',
    examples: [
      {
        name: 'dictionaryTypeCodeExists',
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
    module: '字典类型',
    action: '更新字典类型',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'dictValue', label: 'dictValue' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.dictionaryType.update)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDictionaryTypeDto) {
    return this.dictionaryTypesService.updateType(id, dto);
  }

  @ApiOperation({
    summary: '删除字典类型',
    description: '根据字典类型 ID 删除根节点，并级联删除其下全部字典项。'
  })
  @ApiParam({
    name: 'id',
    description: '字典类型 ID',
    example: 'dict_common_status'
  })
  @ApiSuccessResponse({
    description: '字典类型删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典类型不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '字典类型',
    action: '删除字典类型',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.dictionaryType.delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dictionaryTypesService.removeType(id);
  }
}
