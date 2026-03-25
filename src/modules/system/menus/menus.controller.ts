import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { CurrentUser } from '../../iam/auth/current-user.decorator';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { SYSTEM_PERMISSION_POINTS } from '../../iam/permissions/permission-point-codes';
import {
  RequireMenuPermission,
  RequirePermissions
} from '../../iam/permissions/require-permissions.decorator';
import {
  CreateMenuDto,
  MenuListQueryDto,
  MenuTreeQueryDto,
  SyncMenusDto,
  UpdateMenuDto,
  UpdateMenuStatusDto
} from './menus.dto';
import {
  MenuItemResponseDto,
  MenuPageResponseDto,
  MenuTreeItemResponseDto
} from './menus.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { MenusService } from './menus.service';

@ApiTags('系统管理 / 菜单管理')
@ApiServerErrorResponse()
@RequireMenuPermission('main_system_menu')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @ApiOperation({
    summary: '菜单分页列表',
    description: '分页查询菜单列表，支持标题关键字筛选。'
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'title',
    required: false,
    example: '系统',
    description: '菜单标题关键字'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '菜单状态，true 为启用，false 为停用'
  })
  @ApiSuccessResponse({
    type: MenuPageResponseDto,
    description: '菜单分页列表响应',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          pid: 0,
          id: 1001,
          title: '用户管理',
          name: 'UserManage',
          type: 2,
          path: '/system/users',
          key: 'system:user:list',
          icon: 'UserOutlined',
          layout: 'default',
          isVisible: true,
          status: true,
          component: 'system/users/index',
          redirect: '/system/users/list',
          meta: {
            title: '用户管理',
            keepAlive: true
          },
          sort: 10,
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
  list(@Query() query: MenuListQueryDto) {
    return this.menusService.list(query);
  }

  @ApiOperation({
    summary: '菜单树',
    description: '返回树形菜单结构，适用于动态路由和权限配置。'
  })
  @ApiSuccessResponse({
    type: MenuTreeItemResponseDto,
    isArray: true,
    extraModels: [MenuItemResponseDto],
    description: '菜单树结构响应',
    dataExample: [
      {
        pid: 0,
        id: 1000,
        title: '系统管理',
        name: 'SystemManage',
        type: 1,
        path: '/system',
        key: 'system:root',
        icon: 'SettingOutlined',
        layout: 'default',
        isVisible: true,
        status: true,
        component: 'LAYOUT',
        meta: {
          title: '系统管理'
        },
        sort: 1,
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z',
        children: [
          {
            pid: 1000,
            id: 1001,
            title: '用户管理',
            name: 'UserManage',
            type: 2,
            path: '/system/users',
            key: 'system:user:list',
            icon: 'UserOutlined',
            layout: 'default',
            isVisible: true,
            status: true,
            component: 'system/users/index',
            meta: {
              title: '用户管理'
            },
            sort: 10,
            createdAt: '2026-03-22T14:30:00.000Z',
            updatedAt: '2026-03-22T14:30:00.000Z'
          }
        ]
      }
    ]
  })
  @ApiQuery({
    name: 'view',
    required: false,
    example: 'platform',
    description:
      '菜单树视角，platform 返回全量菜单树，tenant 返回当前租户已授权菜单树'
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    example: 'clxrole1234567890',
    description: '角色 ID，传入后返回该角色已分配菜单树'
  })
  @ApiErrorResponse({
    status: 403,
    description: '缺少租户上下文，无法返回租户或角色视角菜单树',
    examples: [
      {
        name: 'tenantAccessDenied',
        code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED
      }
    ]
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
  @Get('tree')
  tree(@CurrentUser() user: JwtPayload, @Query() query: MenuTreeQueryDto) {
    return this.menusService.tree(user, query);
  }

  @ApiOperation({
    summary: '菜单详情',
    description: '根据菜单 ID 查询菜单详情。'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiSuccessResponse({
    type: MenuItemResponseDto,
    description: '菜单详情响应',
    dataExample: {
      pid: 0,
      id: 1001,
      title: '用户管理',
      name: 'UserManage',
      type: 2,
      path: '/system/users',
      key: 'system:user:list',
      icon: 'UserOutlined',
      layout: 'default',
      isVisible: true,
      status: true,
      component: 'system/users/index',
      redirect: '/system/users/list',
      meta: {
        title: '用户管理'
      },
      sort: 10,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '菜单不存在',
    examples: [
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.detail(id);
  }

  @ApiOperation({
    summary: '创建菜单',
    description: '新增目录、菜单或按钮。'
  })
  @ApiBody({ type: CreateMenuDto })
  @ApiSuccessResponse({
    type: MenuItemResponseDto,
    description: '菜单创建成功响应',
    dataExample: {
      pid: 0,
      id: 1001,
      title: '用户管理',
      name: 'UserManage',
      type: 2,
      path: '/system/users',
      key: 'system:user:list',
      icon: 'UserOutlined',
      layout: 'default',
      isVisible: true,
      status: true,
      component: 'system/users/index',
      redirect: '/system/users/list',
      meta: {
        title: '用户管理'
      },
      sort: 10,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
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
  @ApiErrorResponse({
    status: 400,
    description: '菜单层级关系不合法',
    examples: [
      {
        name: 'menuHierarchyInvalid',
        code: BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '菜单权限标识已存在',
    examples: [
      {
        name: 'menuKeyAlreadyExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @SystemLog({
    module: '菜单管理',
    action: '创建菜单',
    targets: [{ source: 'body', key: 'title', label: 'title' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.menu.create)
  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @ApiOperation({
    summary: '批量同步菜单树',
    description:
      '批量同步菜单的父子挂载关系和排序值，适用于前端拖拽调整菜单树结构。'
  })
  @ApiBody({ type: SyncMenusDto })
  @ApiSuccessResponse({
    type: MenuTreeItemResponseDto,
    isArray: true,
    extraModels: [MenuItemResponseDto],
    description: '菜单树同步后的最新结构',
    dataExample: [
      {
        pid: 0,
        id: 1000,
        title: '系统管理',
        name: 'SystemManage',
        type: 1,
        path: '/system',
        key: 'system:root',
        icon: 'SettingOutlined',
        layout: 'default',
        isVisible: true,
        status: true,
        component: 'LAYOUT',
        sort: 1,
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-23T10:00:00.000Z',
        children: [
          {
            pid: 1000,
            id: 1001,
            title: '用户管理',
            name: 'UserManage',
            type: 2,
            path: '/system/users',
            key: 'system:user:list',
            icon: 'UserOutlined',
            layout: 'default',
            isVisible: true,
            status: true,
            component: 'system/users/index',
            sort: 10,
            createdAt: '2026-03-22T14:30:00.000Z',
            updatedAt: '2026-03-23T10:00:00.000Z'
          }
        ]
      }
    ]
  })
  @ApiErrorResponse({
    status: 400,
    description: '菜单层级关系不合法',
    examples: [
      {
        name: 'menuHierarchyInvalid',
        code: BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '菜单不存在',
    examples: [
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '批量同步参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @SystemLog({
    module: '菜单管理',
    action: '批量同步菜单树',
    targets: [{ source: 'body', key: 'menus', label: 'menus' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.menu.sync)
  @Put('sync')
  sync(@Body() dto: SyncMenusDto) {
    return this.menusService.sync(dto);
  }

  @ApiOperation({
    summary: '更新菜单',
    description: '根据菜单 ID 更新菜单信息。'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiBody({ type: UpdateMenuDto })
  @ApiSuccessResponse({
    type: MenuItemResponseDto,
    description: '菜单更新成功响应',
    dataExample: {
      pid: 0,
      id: 1001,
      title: '用户管理',
      name: 'UserManage',
      type: 2,
      path: '/system/users',
      key: 'system:user:list',
      icon: 'UserOutlined',
      layout: 'default',
      isVisible: true,
      status: true,
      component: 'system/users/index',
      redirect: '/system/users/list',
      meta: {
        title: '用户管理',
        keepAlive: true
      },
      sort: 20,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '菜单不存在',
    examples: [
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
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
    module: '菜单管理',
    action: '更新菜单',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'title', label: 'title' }
    ]
  })
  @ApiErrorResponse({
    status: 400,
    description: '菜单层级关系不合法',
    examples: [
      {
        name: 'menuHierarchyInvalid',
        code: BUSINESS_ERROR_CODES.MENU_HIERARCHY_INVALID
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '菜单权限标识已存在',
    examples: [
      {
        name: 'menuKeyAlreadyExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.menu.update)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @ApiOperation({
    summary: '更新菜单状态',
    description:
      '根据菜单 ID 更新启停用状态；停用父菜单时会级联停用全部子菜单。'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiBody({ type: UpdateMenuStatusDto })
  @ApiSuccessResponse({
    type: MenuItemResponseDto,
    description: '菜单状态更新成功响应',
    dataExample: {
      pid: 0,
      id: 1001,
      title: '用户管理',
      name: 'UserManage',
      type: 2,
      path: '/system/users',
      key: 'system:user:list',
      icon: 'UserOutlined',
      layout: 'default',
      isVisible: true,
      status: false,
      component: 'system/users/index',
      redirect: '/system/users/list',
      meta: {
        title: '用户管理',
        keepAlive: true
      },
      sort: 20,
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '菜单不存在',
    examples: [
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
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
    module: '菜单管理',
    action: '更新菜单状态',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'status', label: 'status' }
    ]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.menu.status)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuStatusDto
  ) {
    return this.menusService.updateStatus(id, dto);
  }

  @ApiOperation({
    summary: '删除菜单',
    description: '根据菜单 ID 删除菜单及其子节点。'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiSuccessResponse({
    description: '菜单删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '菜单不存在',
    examples: [
      {
        name: 'menuNotFound',
        code: BUSINESS_ERROR_CODES.MENU_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '菜单管理',
    action: '删除菜单',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @RequirePermissions(SYSTEM_PERMISSION_POINTS.menu.delete)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}
