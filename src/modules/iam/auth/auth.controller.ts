import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../../shared/swagger/swagger-response';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';
import {
  AuthUserResponseDto,
  LoginResultResponseDto
} from './auth.response.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './jwt-payload.interface';

@ApiTags('认证中心 / 登录认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '账号登录',
    description: '使用用户名和密码登录，返回 Bearer Token 及当前用户信息。'
  })
  @ApiBody({ type: LoginDto })
  @ApiSuccessResponse({
    type: LoginResultResponseDto,
    description: '登录成功响应',
    dataExample: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.signature',
      tokenType: 'Bearer',
      expiresIn: '2h',
      user: {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '系统管理员'
      }
    }
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: '当前登录用户',
    description: '基于 Bearer Token 返回当前登录用户资料。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    type: AuthUserResponseDto,
    description: '当前登录用户信息',
    dataExample: {
      id: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员'
    }
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
