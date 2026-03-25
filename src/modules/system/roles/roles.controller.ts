import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  AssignRoleDataScopeDto,
  AssignRoleMenusDto,
  CreateRoleDto,
  RoleListQueryDto,
  UpdateRoleStatusDto,
  UpdateRoleDto
} from './roles.dto';
import {
  RoleDataScopeResponseDto,
  RoleItemResponseDto,
  RoleMenuAssignmentResponseDto,
  RolePageResponseDto
} from './roles.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { RolesService } from './roles.service';

@ApiTags('系统管理 / 角色管理')
@ApiServerErrorResponse()
@RequireMenuPermission('main_system_role')
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
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '角色状态，true 为启用，false 为停用'
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
          dataScope: 'CUSTOM',
          dataScopeDeptIds: [100, 120],
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
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiSuccessResponse({
    type: RoleItemResponseDto,
    description: '角色详情响应',
    dataExample: {
      id: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      sort: 10,
      status: true,
      dataScope: 'CUSTOM',
      dataScopeDeptIds: [100, 120],
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
    summary: '角色数据权限范围',
    description: '根据角色 ID 查询当前角色的数据权限范围及自定义部门。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiSuccessResponse({
    type: RoleDataScopeResponseDto,
    description: '角色数据权限范围响应',
    dataExample: {
      roleId: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      dataScope: 'CUSTOM',
      departmentIds: [100, 120],
      departments: [
        {
          id: 100,
          pid: 0,
          name: '总部',
          code: 'headquarters'
        },
        {
          id: 120,
          pid: 100,
          name: '运营支持部',
          code: 'operations_support'
        }
      ]
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
  @Get(':id/data-scope')
  dataScope(@Param('id') id: string) {
    return this.rolesService.dataScope(id);
  }

  @ApiOperation({
    summary: '角色已分配菜单',
    description: '根据角色 ID 查询当前已分配的菜单 ID 列表和菜单明细。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiSuccessResponse({
    type: RoleMenuAssignmentResponseDto,
    description: '角色菜单分配详情响应',
    dataExample: {
      roleId: 'clxrole1234567890',
      name: '超级管理员',
      code: 'super_admin',
      menuIds: [1, 2, 3, 11],
      menus: [
        {
          id: 1,
          pid: 0,
          title: '系统管理',
          name: 'SystemManage',
          type: 1,
          path: '/system',
          key: 'system:root',
          permissionCode: 'system:root',
          isVisible: true,
          sort: 1
        },
        {
          id: 11,
          pid: 1,
          title: '通知公告',
          name: 'NoticeManage',
          type: 2,
          path: '/system/notices',
          key: 'system:notice:list',
          permissionCode: 'system:notice:list',
          isVisible: true,
          sort: 11
        }
      ]
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
  @Get(':id/menus')
  menus(@Param('id') id: string) {
    return this.rolesService.menus(id);
  }

  @ApiOperation({
    summary: '创建角色',
    description: '新增系统角色，并可同时初始化数据权限范围。'
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
      dataScope: 'CUSTOM',
      dataScopeDeptIds: [100, 120],
      remark: '负责租户内的管理工作',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 400,
    description: '数据权限配置不合法',
    examples: [
      {
        name: 'invalidDataScopeConfig',
        code: BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '自定义数据权限部门不存在',
    examples: [
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
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
    description: '创建参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '角色管理',
    action: '创建角色',
    targets: [{ source: 'body', key: 'code', label: 'code' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.create)
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @ApiOperation({
    summary: '更新角色',
    description: '根据角色 ID 更新角色信息，并可同步更新数据权限范围。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
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
      dataScope: 'DEPARTMENT_AND_CHILDREN',
      dataScopeDeptIds: [],
      remark: '更新后的角色备注',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 400,
    description: '数据权限配置不合法',
    examples: [
      {
        name: 'invalidDataScopeConfig',
        code: BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色或部门不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      },
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
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
  @SystemLog({
    module: '角色管理',
    action: '更新角色',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'code', label: 'code' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.update)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @ApiOperation({
    summary: '修改角色状态',
    description: '根据角色 ID 启用或停用角色。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiBody({ type: UpdateRoleStatusDto })
  @ApiSuccessResponse({
    type: RoleItemResponseDto,
    description: '角色状态修改成功响应',
    dataExample: {
      id: 'clxrole1234567890',
      tenantId: 'tenant_001',
      name: '租户管理员',
      code: 'tenant_admin',
      sort: 10,
      status: false,
      dataScope: 'CUSTOM',
      dataScopeDeptIds: [100, 120],
      remark: '负责租户内的管理工作',
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
    module: '角色管理',
    action: '修改角色状态',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'status', label: 'status' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.status)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRoleStatusDto) {
    return this.rolesService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: '分配角色数据权限',
    description: '根据角色 ID 单独配置当前角色的数据权限范围。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiBody({ type: AssignRoleDataScopeDto })
  @ApiSuccessResponse({
    type: RoleDataScopeResponseDto,
    description: '角色数据权限分配结果响应',
    dataExample: {
      roleId: 'clxrole1234567890',
      name: '租户管理员',
      code: 'tenant_admin',
      dataScope: 'CUSTOM',
      departmentIds: [100, 120],
      departments: [
        {
          id: 100,
          pid: 0,
          name: '总部',
          code: 'headquarters'
        },
        {
          id: 120,
          pid: 100,
          name: '运营支持部',
          code: 'operations_support'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 400,
    description: '数据权限配置不合法',
    examples: [
      {
        name: 'invalidDataScopeConfig',
        code: BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色或部门不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      },
      {
        name: 'departmentNotFound',
        code: BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '分配参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '角色管理',
    action: '分配数据权限',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'dataScope', label: 'dataScope' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.dataScope)
  @Put(':id/data-scope')
  assignDataScope(
    @Param('id') id: string,
    @Body() dto: AssignRoleDataScopeDto
  ) {
    return this.rolesService.assignDataScope(id, dto);
  }

  @ApiOperation({
    summary: '分配角色菜单',
    description:
      '根据角色 ID 覆盖更新当前角色的菜单权限集合，传空数组表示清空全部菜单权限。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
  @ApiBody({ type: AssignRoleMenusDto })
  @ApiSuccessResponse({
    type: RoleMenuAssignmentResponseDto,
    description: '角色菜单分配结果响应',
    dataExample: {
      roleId: 'clxrole1234567890',
      name: '超级管理员',
      code: 'super_admin',
      menuIds: [1, 2, 3, 11],
      menus: [
        {
          id: 1,
          pid: 0,
          title: '系统管理',
          name: 'SystemManage',
          type: 1,
          path: '/system',
          key: 'system:root',
          permissionCode: 'system:root',
          isVisible: true,
          sort: 1
        },
        {
          id: 11,
          pid: 1,
          title: '通知公告',
          name: 'NoticeManage',
          type: 2,
          path: '/system/notices',
          key: 'system:notice:list',
          permissionCode: 'system:notice:list',
          isVisible: true,
          sort: 11
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '角色或菜单不存在',
    examples: [
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
      },
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '分配参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '角色管理',
    action: '分配角色菜单',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'menuIds', label: 'menuIds' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.assignMenu)
  @Put(':id/menus')
  assignMenus(@Param('id') id: string, @Body() dto: AssignRoleMenusDto) {
    return this.rolesService.assignMenus(id, dto);
  }

  @ApiOperation({
    summary: '删除角色',
    description: '根据角色 ID 删除角色。'
  })
  @ApiParam({
    name: 'id',
    description: '角色 ID',
    example: 'clxrole1234567890'
  })
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
  @SystemLog({
    module: '角色管理',
    action: '删除角色',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.role.delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
