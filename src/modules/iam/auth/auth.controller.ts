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
import { LoginDto } from './auth.dto';

@ApiTags('认证中心')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '登录',
    description: '使用用户名和密码登录，返回 JWT Bearer Token'
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
      '登录成功'
    )
  )
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
