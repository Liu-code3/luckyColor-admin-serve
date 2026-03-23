import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { RequireMenuPermission } from '../../iam/permissions/require-permissions.decorator';
import {
  CreateDepartmentDto,
  DepartmentListQueryDto,
  UpdateDepartmentDto,
  UpdateDepartmentStatusDto
} from './departments.dto';
import {
  DepartmentItemResponseDto,
  DepartmentPageResponseDto,
  DepartmentTreeItemResponseDto
} from './departments.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { DepartmentsService } from './departments.service';

@ApiTags('系统管理 / 部门管理')
@ApiServerErrorResponse()
@RequireMenuPermission('main_system_department')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @ApiOperation({
    summary: '部门分页列表',
    description: '分页查询部门列表，支持名称或编码关键字筛选。'
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
    example: '研发',
    description: '部门名称或编码关键字'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '部门状态，true 为启用，false 为停用'
  })
  @ApiSuccessResponse({
    type: DepartmentPageResponseDto,
    description: '部门分页列表响应',
    dataExample: {
      total: 3,
      current: 1,
      size: 10,
      records: [
        {
          pid: 100,
          id: 110,
          name: '产品研发部',
          code: 'product_rd',
          leader: '李工',
          phone: '13800000001',
          email: 'rd@luckycolor.local',
          sort: 10,
          status: true,
          remark: '负责产品设计与技术研发',
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
  list(@Query() query: DepartmentListQueryDto) {
    return this.departmentsService.list(query);
  }

  @ApiOperation({
    summary: '部门树',
    description: '返回树形部门结构，适用于组织架构选择。'
  })
  @ApiSuccessResponse({
    type: DepartmentTreeItemResponseDto,
    isArray: true,
    extraModels: [DepartmentItemResponseDto],
    description: '部门树结构响应',
    dataExample: [
      {
        pid: 0,
        id: 100,
        name: '总部',
        code: 'headquarters',
        leader: '张总',
        phone: '13800000000',
        email: 'hq@luckycolor.local',
        sort: 1,
        status: true,
        remark: '平台总部组织',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z',
        children: [
          {
            pid: 100,
            id: 110,
            name: '产品研发部',
            code: 'product_rd',
            leader: '李工',
            phone: '13800000001',
            email: 'rd@luckycolor.local',
            sort: 10,
            status: true,
            remark: '负责产品设计与技术研发',
            createdAt: '2026-03-22T14:30:00.000Z',
            updatedAt: '2026-03-22T14:30:00.000Z'
          }
        ]
      }
    ]
  })
  @Get('tree')
  tree() {
    return this.departmentsService.tree();
  }

  @ApiOperation({
    summary: '部门详情',
    description: '根据部门 ID 查询部门详情。'
  })
  @ApiParam({ name: 'id', description: '部门 ID', example: 110 })
  @ApiSuccessResponse({
    type: DepartmentItemResponseDto,
    description: '部门详情响应',
    dataExample: {
      pid: 100,
      id: 110,
      name: '产品研发部',
      code: 'product_rd',
      leader: '李工',
      phone: '13800000001',
      email: 'rd@luckycolor.local',
      sort: 10,
      status: true,
      remark: '负责产品设计与技术研发',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '部门不存在',
    examples: [
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.detail(id);
  }

  @ApiOperation({
    summary: '创建部门',
    description: '新增部门节点。'
  })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiSuccessResponse({
    type: DepartmentItemResponseDto,
    description: '部门创建成功响应',
    dataExample: {
      pid: 100,
      id: 110,
      name: '产品研发部',
      code: 'product_rd',
      leader: '李工',
      phone: '13800000001',
      email: 'rd@luckycolor.local',
      sort: 10,
      status: true,
      remark: '负责产品设计与技术研发',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 409,
    description: '部门编码已存在',
    examples: [
      {
        name: 'departmentCodeExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '父级部门不存在',
    examples: [
      {
        name: 'parentDepartmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 400,
    description: '部门层级关系不合法',
    examples: [
      {
        name: 'departmentHierarchyInvalid',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID
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
    module: '部门管理',
    action: '创建部门',
    targets: [{ source: 'body', key: 'name', label: 'name' }]
  })
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @ApiOperation({
    summary: '更新部门',
    description: '根据部门 ID 更新部门信息。'
  })
  @ApiParam({ name: 'id', description: '部门 ID', example: 110 })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiSuccessResponse({
    type: DepartmentItemResponseDto,
    description: '部门更新成功响应',
    dataExample: {
      pid: 100,
      id: 110,
      name: '产品研发部',
      code: 'product_rd',
      leader: '李工',
      phone: '13800000001',
      email: 'rd@luckycolor.local',
      sort: 20,
      status: true,
      remark: '更新后的部门备注',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '部门不存在，或父级部门不存在',
    examples: [
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '部门编码已存在',
    examples: [
      {
        name: 'departmentCodeExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 400,
    description: '部门层级关系不合法',
    examples: [
      {
        name: 'departmentHierarchyInvalid',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_HIERARCHY_INVALID
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
    module: '部门管理',
    action: '更新部门',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'name', label: 'name' }
    ]
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto
  ) {
    return this.departmentsService.update(id, dto);
  }

  @ApiOperation({
    summary: '更新部门状态',
    description: '根据部门 ID 更新启停用状态。'
  })
  @ApiParam({ name: 'id', description: '部门 ID', example: 110 })
  @ApiBody({ type: UpdateDepartmentStatusDto })
  @ApiSuccessResponse({
    type: DepartmentItemResponseDto,
    description: '部门状态更新成功响应',
    dataExample: {
      pid: 100,
      id: 110,
      name: '产品研发部',
      code: 'product_rd',
      leader: '李工',
      phone: '13800000001',
      email: 'rd@luckycolor.local',
      sort: 20,
      status: false,
      remark: '更新后的部门备注',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '部门不存在',
    examples: [
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
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
    module: '部门管理',
    action: '更新部门状态',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'status', label: 'status' }
    ]
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentStatusDto
  ) {
    return this.departmentsService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: '删除部门',
    description: '根据部门 ID 删除部门及其子节点。'
  })
  @ApiParam({ name: 'id', description: '部门 ID', example: 110 })
  @ApiSuccessResponse({
    description: '部门删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '部门不存在',
    examples: [
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '部门管理',
    action: '删除部门',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}
