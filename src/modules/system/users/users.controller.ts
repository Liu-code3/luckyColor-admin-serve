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
import { RequirePermissions } from '../../iam/permissions/require-permissions.decorator';
import {
  AssignUserRolesDto,
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto
} from './users.dto';
import {
  UserItemResponseDto,
  UserPageResponseDto,
  UserRoleAssignmentResponseDto
} from './users.response.dto';
import { SystemLog } from '../system-logs/system-log.decorator';
import { UsersService } from './users.service';

@ApiTags('系统管理 / 用户管理')
@ApiServerErrorResponse()
@RequirePermissions('main_system_users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: '用户分页列表',
    description: '分页查询用户列表，支持用户名或昵称关键字筛选。'
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
    description: '用户名或昵称关键字'
  })
  @ApiSuccessResponse({
    type: UserPageResponseDto,
    description: '用户分页列表响应',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'clx1234567890',
          username: 'admin',
          nickname: '系统管理员',
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
  list(@Query() query: UserListQueryDto) {
    return this.usersService.list(query);
  }

  @ApiOperation({
    summary: '用户详情',
    description: '根据用户 ID 查询用户详情。'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiSuccessResponse({
    type: UserItemResponseDto,
    description: '用户详情响应',
    dataExample: {
      id: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '用户不存在',
    examples: [
      {
        name: 'userNotFound',
        code: BUSINESS_ERROR_CODES.USER_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.usersService.detail(id);
  }

  @ApiOperation({
    summary: '用户已分配角色',
    description: '根据用户 ID 查询当前已分配的角色 ID 列表和角色明细。'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiSuccessResponse({
    type: UserRoleAssignmentResponseDto,
    description: '用户角色分配详情响应',
    dataExample: {
      userId: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员',
      roleIds: ['clxrole1234567890'],
      roles: [
        {
          id: 'clxrole1234567890',
          name: '超级管理员',
          code: 'super_admin',
          sort: 1,
          status: true
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '用户不存在',
    examples: [
      {
        name: 'userNotFound',
        code: BUSINESS_ERROR_CODES.USER_NOT_FOUND
      }
    ]
  })
  @Get(':id/roles')
  roles(@Param('id') id: string) {
    return this.usersService.roles(id);
  }

  @ApiOperation({
    summary: '创建用户',
    description: '新增后台管理用户。'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiSuccessResponse({
    type: UserItemResponseDto,
    description: '用户创建成功响应',
    dataExample: {
      id: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员',
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
  @SystemLog({
    module: '用户管理',
    action: '创建用户',
    targets: [{ source: 'body', key: 'username', label: 'username' }]
  })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({
    summary: '更新用户',
    description: '根据用户 ID 更新用户信息。'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiBody({ type: UpdateUserDto })
  @ApiSuccessResponse({
    type: UserItemResponseDto,
    description: '用户更新成功响应',
    dataExample: {
      id: 'clx1234567890',
      username: 'admin',
      nickname: '管理员',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T15:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '用户不存在',
    examples: [
      {
        name: 'userNotFound',
        code: BUSINESS_ERROR_CODES.USER_NOT_FOUND
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
    module: '用户管理',
    action: '更新用户',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'username', label: 'username' }
    ]
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({
    summary: '分配用户角色',
    description:
      '根据用户 ID 覆盖更新当前用户的角色集合，传空数组表示清空全部角色。'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiSuccessResponse({
    type: UserRoleAssignmentResponseDto,
    description: '用户角色分配结果响应',
    dataExample: {
      userId: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员',
      roleIds: ['clxrole1234567890', 'clxrole0987654321'],
      roles: [
        {
          id: 'clxrole1234567890',
          name: '超级管理员',
          code: 'super_admin',
          sort: 1,
          status: true
        },
        {
          id: 'clxrole0987654321',
          name: '租户管理员',
          code: 'tenant_admin',
          sort: 10,
          status: true
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '用户或角色不存在',
    examples: [
      {
        name: 'userNotFound',
        code: BUSINESS_ERROR_CODES.USER_NOT_FOUND
      },
      {
        name: 'roleNotFound',
        code: BUSINESS_ERROR_CODES.ROLE_NOT_FOUND
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
    module: '用户管理',
    action: '分配用户角色',
    targets: [
      { source: 'param', key: 'id', label: 'id' },
      { source: 'body', key: 'roleIds', label: 'roleIds' }
    ]
  })
  @Put(':id/roles')
  assignRoles(@Param('id') id: string, @Body() dto: AssignUserRolesDto) {
    return this.usersService.assignRoles(id, dto);
  }

  @ApiOperation({
    summary: '删除用户',
    description: '根据用户 ID 删除用户。'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiSuccessResponse({
    description: '用户删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiErrorResponse({
    status: 404,
    description: '用户不存在',
    examples: [
      {
        name: 'userNotFound',
        code: BUSINESS_ERROR_CODES.USER_NOT_FOUND
      }
    ]
  })
  @SystemLog({
    module: '用户管理',
    action: '删除用户',
    targets: [{ source: 'param', key: 'id', label: 'id' }]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
