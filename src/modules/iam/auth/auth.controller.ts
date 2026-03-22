import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { buildSuccessResponseSchema } from '../../../shared/swagger/swagger-response';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './jwt-payload.interface';
import { LoginDto, MenuListDto } from './auth.dto';

@ApiTags('认证中心')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '旧版登录',
    description: '返回历史 token，兼容旧前端登录流程'
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      '8f9c8dbf9bbf4ce7a707e8a0937f4db0',
      '登录成功'
    )
  )
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'JWT 登录',
    description: '返回 Bearer Token，用于新鉴权链路'
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature',
        tokenType: 'Bearer',
        expiresIn: '2h',
        user: {
          id: 'clx1234567890',
          username: 'admin',
          nickname: '系统管理员'
        }
      },
      'JWT登录成功'
    )
  )
  @Post('jwt-login')
  jwtLogin(@Body() dto: LoginDto) {
    return this.authService.jwtLogin(dto);
  }

  @ApiOperation({
    summary: '旧版菜单列表',
    description: '根据旧版 token 获取菜单列表，兼容存量前端'
  })
  @ApiBody({ type: MenuListDto })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      [
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
          }
        }
      ],
      '获取菜单成功'
    )
  )
  @Post('menu-list')
  menuList(@Body() dto: MenuListDto) {
    return this.authService.getMenuList(dto);
  }

  @ApiOperation({
    summary: '当前登录用户信息',
    description: '基于 Bearer Token 返回当前登录用户资料'
  })
  @ApiBearerAuth()
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '系统管理员'
      },
      'success'
    )
  )
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
