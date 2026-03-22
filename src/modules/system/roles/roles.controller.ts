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
import {
  CreateRoleDto,
  RoleListQueryDto,
  UpdateRoleDto
} from './roles.dto';
import { RoleItemResponseDto, RolePageResponseDto } from './roles.response.dto';
import { RolesService } from './roles.service';

@ApiTags('系统管理 / 角色管理')
@ApiServerErrorResponse()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({
    summary: '角色分页列表',
    description: '分页查询角色列表，支持名称或编码关键字筛选。'
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
    example: 'admin',
    description: '角色名称或编码关键字'
  })
  @ApiSuccessResponse({
    type: RolePageResponseDto,
    description: '角色分页列表响应',
    dataExample: {
      total: 3,
      current: 1,
      size: 10,
      records: [
        {
          id: 'clxrole1234567890',
          name: '租户管理员',
          code: 'tenant_admin',
          sort: 10,
          status: true,
          remark: '负责租户内的管理工作',
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
  list(@Query() query: RoleListQueryDto) {
    return this.rolesService.list(query);
  }

  @ApiOperation({
    summary: '角色详情',
    description: '根据角色 ID 查询角色详情。'
  })
  @ApiParam({ name: 'id', description: '角色 ID', example: 'clxrole1234567890' })
  @ApiSuccessResponse({
    type: RoleItemResponseDto,
    description: '角色详情响应',
    dataExample: {
      id: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      sort: 10,
      status: true,
      remark: '负责租户内的管理工作',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.rolesService.detail(id);
  }

  @ApiOperation({
    summary: '创建角色',
    description: '新增系统角色。'
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiSuccessResponse({
    type: RoleItemResponseDto,
    description: '角色创建成功响应',
    dataExample: {
      id: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      sort: 10,
      status: true,
      remark: '负责租户内的管理工作',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 409,
    description: '角色编码已存在',
    examples: [
      {
        name: 'roleCodeExists',
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
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @ApiOperation({
    summary: '更新角色',
    description: '根据角色 ID 更新角色信息。'
  })
  @ApiParam({ name: 'id', description: '角色 ID', example: 'clxrole1234567890' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiSuccessResponse({
    type: RoleItemResponseDto,
    description: '角色更新成功响应',
    dataExample: {
      id: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      sort: 20,
      status: true,
      remark: '更新后的角色备注',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '角色编码已存在',
    examples: [
      {
        name: 'roleCodeExists',
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除角色',
    description: '根据角色 ID 删除角色。'
  })
  @ApiParam({ name: 'id', description: '角色 ID', example: 'clxrole1234567890' })
  @ApiSuccessResponse({
    description: '角色删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      }
    ]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
