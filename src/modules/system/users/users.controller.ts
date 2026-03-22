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
import { CreateUserDto, UpdateUserDto, UserListQueryDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('系统管理 / 用户管理')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: '用户分页列表',
    description: '分页查询用户列表，支持关键字筛选'
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
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
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
      },
      '获取用户列表成功'
    )
  )
  @Get()
  list(@Query() query: UserListQueryDto) {
    return this.usersService.list(query);
  }

  @ApiOperation({
    summary: '用户详情',
    description: '根据用户 ID 查询详情'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '系统管理员',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      '获取用户详情成功'
    )
  )
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.usersService.detail(id);
  }

  @ApiOperation({
    summary: '创建用户',
    description: '新增后台管理用户'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '系统管理员',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      '创建用户成功'
    )
  )
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({
    summary: '更新用户',
    description: '根据用户 ID 更新用户信息'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '管理员',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T15:00:00.000Z'
      },
      '更新用户成功'
    )
  )
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除用户',
    description: '根据用户 ID 删除用户'
  })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'clx1234567890' })
  @ApiOkResponse(buildSuccessResponseSchema(true, '删除用户成功'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
