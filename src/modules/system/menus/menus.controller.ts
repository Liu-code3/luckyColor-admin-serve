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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { buildSuccessResponseSchema } from '../../../shared/swagger/swagger-response';
import { CreateMenuDto, MenuListQueryDto, UpdateMenuDto } from './menus.dto';
import { MenusService } from './menus.service';

@ApiTags('系统管理 / 菜单管理')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @ApiOperation({
    summary: '菜单分页列表',
    description: '分页查询菜单列表，支持标题关键字筛选'
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
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
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
      },
      '获取菜单列表成功'
    )
  )
  @Get()
  list(@Query() query: MenuListQueryDto) {
    return this.menusService.list(query);
  }

  @ApiOperation({
    summary: '菜单树',
    description: '返回树形菜单结构，适用于路由和授权配置'
  })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      [
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
      ],
      '获取菜单树成功'
    )
  )
  @Get('tree')
  tree() {
    return this.menusService.tree();
  }

  @ApiOperation({
    summary: '菜单详情',
    description: '根据菜单 ID 查询菜单详情'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiOkResponse(
    buildSuccessResponseSchema(
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
        component: 'system/users/index',
        redirect: '/system/users/list',
        meta: {
          title: '用户管理'
        },
        sort: 10,
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      '获取菜单详情成功'
    )
  )
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.detail(id);
  }

  @ApiOperation({
    summary: '创建菜单',
    description: '新增菜单、目录或按钮'
  })
  @ApiBody({ type: CreateMenuDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
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
        component: 'system/users/index',
        redirect: '/system/users/list',
        meta: {
          title: '用户管理'
        },
        sort: 10,
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      '创建菜单成功'
    )
  )
  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @ApiOperation({
    summary: '更新菜单',
    description: '根据菜单 ID 更新菜单信息'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiBody({ type: UpdateMenuDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
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
        component: 'system/users/index',
        redirect: '/system/users/list',
        meta: {
          title: '用户管理',
          keepAlive: true
        },
        sort: 20,
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T15:00:00.000Z'
      },
      '更新菜单成功'
    )
  )
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除菜单',
    description: '根据菜单 ID 删除菜单及其子节点'
  })
  @ApiParam({ name: 'id', description: '菜单 ID', example: 1001 })
  @ApiOkResponse(buildSuccessResponseSchema(true, '删除菜单成功'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}
