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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { buildSuccessResponseSchema } from '../../../shared/swagger/swagger-response';
import {
  CreateDictionaryDto,
  DictionaryPageQueryDto,
  UpdateDictionaryDto
} from './dictionary.dto';
import { DictionaryService } from './dictionary.service';

@ApiTags('系统管理 / 字典管理')
@Controller('dict')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @ApiOperation({
    summary: '字典树',
    description: '返回树形字典结构'
  })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      [
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
      ],
      '操作成功'
    )
  )
  @Get('tree')
  tree() {
    return this.dictionaryService.getTree();
  }

  @ApiOperation({
    summary: '字典分页',
    description: '分页查询字典节点，可按节点 ID 和关键字筛选'
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
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
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
      },
      '获取字典分页成功'
    )
  )
  @Get('page')
  page(@Query() query: DictionaryPageQueryDto) {
    return this.dictionaryService.getPage(query);
  }

  @ApiOperation({
    summary: '字典详情',
    description: '根据字典 ID 查询字典详情'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiOkResponse(
    buildSuccessResponseSchema(
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
      },
      '获取字典详情成功'
    )
  )
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.dictionaryService.detail(id);
  }

  @ApiOperation({
    summary: '创建字典',
    description: '新增字典节点'
  })
  @ApiBody({ type: CreateDictionaryDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
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
      },
      '创建字典成功'
    )
  )
  @Post()
  create(@Body() dto: CreateDictionaryDto) {
    return this.dictionaryService.create(dto);
  }

  @ApiOperation({
    summary: '更新字典',
    description: '根据字典 ID 更新字典信息'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiBody({ type: UpdateDictionaryDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
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
      },
      '更新字典成功'
    )
  )
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDictionaryDto) {
    return this.dictionaryService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除字典',
    description: '根据字典 ID 删除字典及子节点'
  })
  @ApiParam({ name: 'id', description: '字典 ID', example: 'dict_root' })
  @ApiOkResponse(buildSuccessResponseSchema(true, '删除字典成功'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dictionaryService.remove(id);
  }
}
