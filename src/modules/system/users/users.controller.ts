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
  CreateUserDto,
  UpdateUserDto,
  UserListQueryDto
} from './users.dto';
import { UserItemResponseDto, UserPageResponseDto } from './users.response.dto';
import { UsersService } from './users.service';

@ApiTags('系统管理 / 用户管理')
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
