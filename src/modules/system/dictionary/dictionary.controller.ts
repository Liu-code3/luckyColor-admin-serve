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
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import {
  CreateDictionaryDto,
  DictionaryPageQueryDto,
  UpdateDictionaryDto
} from './dictionary.dto';
import {
  DictionaryItemResponseDto,
  DictionaryPageResponseDto,
  DictionaryTreeItemResponseDto
} from './dictionary.response.dto';
import { DictionaryService } from './dictionary.service';

@ApiTags('系统管理 / 字典管理')
@Controller('dict')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @ApiOperation({
    summary: '字典树',
    description: '返回树形字典结构。'
  })
  @ApiSuccessResponse({
    type: DictionaryTreeItemResponseDto,
    isArray: true,
    extraModels: [DictionaryItemResponseDto],
    description: '字典树结构响应',
    dataExample: [
      {
        id: 'dict_root',
        parentId: '0',
        weight: 10,
        name: '状态字典',
        tenantId: 'tenant_001',
        dictLabel: '启用',
        dictValue: 'enabled',
        category: 'system_status',
        sortCode: 100,
        deleteFlag: '0',
        createTime: '2026-03-22 10:00:00',
        createUser: 'admin',
        updateTime: '2026-03-22 10:00:00',
        updateUser: 'admin',
        children: [
          {
            id: 'dict_status_disabled',
            parentId: 'dict_root',
            weight: 20,
            name: '状态字典',
            tenantId: 'tenant_001',
            dictLabel: '停用',
            dictValue: 'disabled',
            category: 'system_status',
            sortCode: 200,
            deleteFlag: '0',
            createTime: '2026-03-22 10:00:00',
            createUser: 'admin',
            updateTime: '2026-03-22 10:00:00',
            updateUser: 'admin'
          }
        ]
      }
    ]
  })
  @Get('tree')
  tree() {
    return this.dictionaryService.getTree();
  }

  @ApiOperation({
    summary: '字典分页',
    description: '分页查询字典节点，可按节点 ID 和关键字筛选。'
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    example: 'dict_root',
    description: '字典节点 ID'
  })
  @ApiQuery({
    name: 'searchKey',
    required: false,
    example: '状态',
    description: '字典标签关键字'
  })
  @ApiSuccessResponse({
    type: DictionaryPageResponseDto,
    description: '字典分页响应',
    dataExample: {
      total: 2,
      size: 10,
      current: 1,
      records: [
        {
          id: 'dict_root',
          parentId: '0',
          weight: 10,
          name: '状态字典',
          tenantId: 'tenant_001',
          dictLabel: '启用',
          dictValue: 'enabled',
          category: 'system_status',
          sortCode: 100,
          deleteFlag: '0',
          createTime: '2026-03-22 10:00:00',
          createUser: 'admin',
          updateTime: '2026-03-22 10:00:00',
          updateUser: 'admin'
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
  @Get('page')
  page(@Query() query: DictionaryPageQueryDto) {
    return this.dictionaryService.getPage(query);
  }

  @ApiOperation({
    summary: '字典详情',
    description: '根据字典 ID 查询字典详情。'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典详情响应',
    dataExample: {
      id: 'dict_root',
      parentId: '0',
      weight: 10,
      name: '状态字典',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'enabled',
      category: 'system_status',
      sortCode: 100,
      deleteFlag: '0',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.dictionaryService.detail(id);
  }

  @ApiOperation({
    summary: '创建字典',
    description: '新增字典节点。'
  })
  @ApiBody({ type: CreateDictionaryDto })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典创建成功响应',
    dataExample: {
      id: 'dict_root',
      parentId: '0',
      weight: 10,
      name: '状态字典',
      tenantId: 'tenant_001',
      dictLabel: '启用',
      dictValue: 'enabled',
      category: 'system_status',
      sortCode: 100,
      deleteFlag: '0',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 10:00:00',
      updateUser: 'admin'
    }
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
  @Post()
  create(@Body() dto: CreateDictionaryDto) {
    return this.dictionaryService.create(dto);
  }

  @ApiOperation({
    summary: '更新字典',
    description: '根据字典 ID 更新字典信息。'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiBody({ type: UpdateDictionaryDto })
  @ApiSuccessResponse({
    type: DictionaryItemResponseDto,
    description: '字典更新成功响应',
    dataExample: {
      id: 'dict_root',
      parentId: '0',
      weight: 20,
      name: '状态字典',
      tenantId: 'tenant_001',
      dictLabel: '停用',
      dictValue: 'disabled',
      category: 'system_status',
      sortCode: 200,
      deleteFlag: '0',
      createTime: '2026-03-22 10:00:00',
      createUser: 'admin',
      updateTime: '2026-03-22 11:00:00',
      updateUser: 'admin'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDictionaryDto) {
    return this.dictionaryService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除字典',
    description: '根据字典 ID 删除字典及其子节点。'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiSuccessResponse({
    description: '字典删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '字典不存在',
    examples: [
      {
        name: 'dictionaryNotFound',
        code: BUSINESS_ERROR_CODES.DICTIONARY_NOT_FOUND
      }
    ]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dictionaryService.remove(id);
  }
}
