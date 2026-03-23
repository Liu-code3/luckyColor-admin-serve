import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { AuthService } from './auth.service';
import { AuthButtonPermissionQueryDto, LoginDto } from './auth.dto';
import {
  AuthAccessResponseDto,
  AuthButtonPermissionResponseDto,
  AuthUserResponseDto,
  LoginResultResponseDto
} from './auth.response.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './jwt-payload.interface';

const AUTH_RUNTIME_FORBIDDEN_EXAMPLES = [
  {
    name: 'accountDisabled',
    code: BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED,
    summary: '当前账号已被禁用'
  },
  {
    name: 'roleDisabled',
    code: BUSINESS_ERROR_CODES.ROLE_DISABLED,
    summary: '当前账号角色已失效'
  },
  {
    name: 'tenantDisabled',
    code: BUSINESS_ERROR_CODES.TENANT_DISABLED,
    summary: '当前租户已被禁用'
  },
  {
    name: 'tenantExpired',
    code: BUSINESS_ERROR_CODES.TENANT_EXPIRED,
    summary: '当前租户已过期'
  },
  {
    name: 'tenantAccessDenied',
    code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED,
    summary: '当前账号不能访问该租户'
  }
];

@ApiTags('认证中心 / 登录认证')
@ApiServerErrorResponse()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '账号登录',
    description: '使用用户名和密码登录，返回 Bearer Token 及当前用户权限摘要。'
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
        nickname: '系统管理员',
        roleCodes: ['super_admin'],
        menuCodeList: ['main_system', 'main_system_users'],
        buttonCodeList: ['system:user:create', 'system:user:update']
      }
    }
  })
  @ApiErrorResponse({
    status: 401,
    description: '登录失败响应',
    examples: [
      {
        name: 'loginFailed',
        code: BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED,
        summary: '用户名或密码错误'
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '登录参数校验失败',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @ApiForbiddenErrorResponse({
    description: '当前账号无法完成登录',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: '当前登录用户',
    description: '基于 Bearer Token 返回当前登录用户资料及权限摘要。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    type: AuthUserResponseDto,
    description: '当前登录用户信息',
    dataExample: {
      id: 'clx1234567890',
      username: 'admin',
      nickname: '系统管理员',
      roleCodes: ['super_admin'],
      menuCodeList: ['main_system', 'main_system_users'],
      buttonCodeList: ['system:user:create', 'system:user:update']
    }
  })
  @ApiUnauthorizedErrorResponse({
    description: '登录态异常响应',
    examples: [
      {
        name: 'tokenExpired',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        summary: '登录已过期'
      },
      {
        name: 'tokenInvalid',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID,
        summary: '登录状态无效'
      }
    ]
  })
  @ApiForbiddenErrorResponse({
    description: '当前登录态不可访问',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }

  @ApiOperation({
    summary: '当前用户访问快照',
    description:
      '返回当前登录用户的角色明细、菜单树和按钮权限，便于前端初始化权限状态。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    type: AuthAccessResponseDto,
    description: '当前用户访问快照',
    dataExample: {
      user: {
        id: 'clx1234567890',
        username: 'admin',
        nickname: '系统管理员',
        roleCodes: ['super_admin'],
        menuCodeList: ['main_system', 'main_system_users'],
        buttonCodeList: ['system:user:create', 'system:user:update']
      },
      roles: [
        {
          id: 'clxrole1234567890',
          name: '超级管理员',
          code: 'super_admin'
        }
      ],
      menuTree: [
        {
          pid: 0,
          id: 4,
          title: '系统管理',
          name: 'system',
          type: 1,
          path: '/systemManagement',
          key: 'main_system',
          icon: 'material-symbols:folder-managed-sharp',
          layout: '',
          isVisible: true,
          component: 'sys',
          sort: 4,
          children: [
            {
              pid: 4,
              id: 5,
              title: '用户管理',
              name: 'systemUsers',
              type: 2,
              path: '/systemManagement/system/users',
              key: 'main_system_users',
              icon: 'mdi:user',
              layout: '',
              isVisible: true,
              component: 'sys/user',
              sort: 5
            }
          ]
        }
      ]
    }
  })
  @ApiUnauthorizedErrorResponse({
    description: '登录态异常响应',
    examples: [
      {
        name: 'tokenExpired',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        summary: '登录已过期'
      },
      {
        name: 'tokenInvalid',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID,
        summary: '登录状态无效'
      }
    ]
  })
  @ApiForbiddenErrorResponse({
    description: '当前登录态不可访问',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @UseGuards(JwtAuthGuard)
  @Get('access')
  access(@CurrentUser() user: JwtPayload) {
    return this.authService.getAccess(user);
  }

  @ApiOperation({
    summary: '当前用户按钮权限查询',
    description:
      '返回当前登录用户拥有的按钮权限码；可选传入 codes 做定向校验，便于前端按权限码控制按钮显示与禁用。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    type: AuthButtonPermissionResponseDto,
    description: '当前用户按钮权限查询结果',
    dataExample: {
      buttonCodeList: ['system:user:create', 'system:user:update'],
      grantedCodeList: ['system:user:create'],
      permissionMap: {
        'system:user:create': true,
        'system:user:delete': false
      }
    }
  })
  @ApiUnauthorizedErrorResponse({
    description: '登录态异常响应',
    examples: [
      {
        name: 'tokenExpired',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        summary: '登录已过期'
      },
      {
        name: 'tokenInvalid',
        code: BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID,
        summary: '登录状态无效'
      }
    ]
  })
  @ApiForbiddenErrorResponse({
    description: '当前登录态不可访问',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @UseGuards(JwtAuthGuard)
  @Get('button-permissions')
  buttonPermissions(
    @CurrentUser() user: JwtPayload,
    @Query() query: AuthButtonPermissionQueryDto
  ) {
    return this.authService.getButtonPermissions(user, query);
  }
}
