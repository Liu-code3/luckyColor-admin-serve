import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
import { RequireMenuPermission } from '../../iam/permissions/require-permissions.decorator';
import { SystemLog } from '../system-logs/system-log.decorator';
import {
  DictionaryItemListQueryDto,
  DictionaryItemSortDto,
  DictionaryItemTreeQueryDto,
  UpdateDictionaryItemStatusDto
} from './dictionary-items.dto';
import { DictionaryItemsService } from './dictionary-items.service';
import {
  DictionaryItemResponseDto,
  DictionaryPageResponseDto,
  DictionaryTreeItemResponseDto
} from './dictionary.response.dto';

@ApiTags('系统管理 / 字典项')
@ApiServerErrorResponse()
@RequireMenuPermission('icomponent_dict')
@Controller('dict/items')
export class DictionaryItemsController {
  constructor(
    private readonly dictionaryItemsService: DictionaryItemsService
  ) {}

  @ApiOperation({
    summary: '字典项分页列表',
    description: '按字典类型分页查询字典项，支持关键字和状态筛选。'
  })
  @ApiQuery({
    name: 'typeId',
    required: true,
    example: 'dict_common_status',
    description: '字典类型 ID'
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
    example: '启用',
    description: '字典项名称、标签或编码关键字'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '状态，true 为启用，false 为停用'
  })
  @ApiSuccessResponse({
    type: DictionaryPageResponseDto,
    description: '字典项分页列表响应',
    dataExample: {
      total: 2,
      current: 1,
      size: 10,
      records: [
        {
          id: 'dict_enabled',
          parentId: 'dict_common_status',
          weight: 10,
          name: '启用',
          tenantId: 'tenant_001',
          dictLabel: '启用',
          dictValue: 'ENABLE',
          category: 'FRM',
          sortCode: 100,
          status: true,
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
    status: 422,
    description: '查询参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get()
  list(@Query() query: DictionaryItemListQueryDto) {
    return this.dictionaryItemsService.list(query);
  }

  @ApiOperation({
    summary: '字典项树',
    description: '按字典类型返回树形字典项结构，支持可选状态筛选。'
  })
  @ApiQuery({
    name: 'typeId',
    required: true,
    example: 'dict_common_status',
    description: '字典类型 ID'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '状态，true 为启用，false 为停用'
  })
  @ApiSuccessResponse({
    type: DictionaryTreeItemResponseDto,
    isArray: true,
    extraModels: [DictionaryItemResponseDto],
    description: '字典项树结构响应',
    dataExample: [
      {
        id: 'dict_enabled',
        parentId: 'dict_common_status',
        weight: 10,
        name: '启用',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'ENABLE',
        category: 'FRM',
        sortCode: 100,
        status: true,
        deleteFlag: 'NOT_DELETE',
        createTime: '2026-03-22 10:00:00',
        createUser: 'admin',
        updateTime: '2026-03-22 10:00:00',
        updateUser: 'admin',
        createdAt: '2026-03-22T10:00:00.000Z',
        updatedAt: '2026-03-22T10:00:00.000Z'
      }
    ]
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
    status: 422,
    description: '查询参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get('tree')
  tree(@Query() query: DictionaryItemTreeQueryDto) {
    return this.dictionaryItemsService.tree(query);
  }

  @ApiOperation({
    summary: '字典项详情',
    description: '根据字典项 ID 查询详情。'
  })
  @ApiParam({
    name: 'id',
    description: '字典项 ID',
    example: 'dict_enabled'
  })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典项详情响应',
    dataExample: {
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 100,
      status: true,
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
    description: '字典项不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.dictionaryItemsService.detail(id);
  }

  @ApiOperation({
    summary: '修改字典项状态',
    description: '根据字典项 ID 修改状态；停用时会级联停用全部子项。'
  })
  @ApiParam({
    name: 'id',
    description: '字典项 ID',
    example: 'dict_enabled'
  })
  @ApiBody({ type: UpdateDictionaryItemStatusDto })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典项状态修改成功响应',
    dataExample: {
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 100,
      status: false,
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
    description: '字典项不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '状态参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '字典项',
    action: '修改字典项状态',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'status', label: 'status' }
    ]
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDictionaryItemStatusDto
  ) {
    return this.dictionaryItemsService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: '修改字典项排序',
    description: '根据字典项 ID 单独调整排序值。'
  })
  @ApiParam({
    name: 'id',
    description: '字典项 ID',
    example: 'dict_enabled'
  })
  @ApiBody({ type: DictionaryItemSortDto })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典项排序更新成功响应',
    dataExample: {
      id: 'dict_enabled',
      parentId: 'dict_common_status',
      weight: 10,
      name: '启用',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'ENABLE',
      category: 'FRM',
      sortCode: 200,
      status: true,
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
    description: '字典项不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '排序参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '字典项',
    action: '修改字典项排序',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'sortCode', label: 'sortCode' }
    ]
  })
  @Patch(':id/sort')
  updateSort(@Param('id') id: string, @Body() dto: DictionaryItemSortDto) {
    return this.dictionaryItemsService.updateSort(id, dto);
  }
}
