import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import {
  AuthButtonPermissionQueryDto,
  LoginDto,
  VerifyLoginCaptchaDto
} from './auth.dto';
import {
  AuthAccessResponseDto,
  AuthButtonPermissionResponseDto,
  AuthRouteItemResponseDto,
  AuthUserResponseDto,
  LoginCaptchaChallengeResponseDto,
  LoginResultResponseDto,
  VerifyLoginCaptchaResponseDto
} from './auth.response.dto';
import { AuthService } from './auth.service';
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
    name: 'tenantFrozen',
    code: BUSINESS_ERROR_CODES.TENANT_FROZEN,
    summary: '当前租户已被冻结'
  },
  {
    name: 'tenantAccessDenied',
    code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED,
    summary: '当前账号不能访问该租户'
  }
];

const AUTH_UNAUTHORIZED_EXAMPLES = [
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
];

interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

@ApiTags('认证中心 / 登录认证')
@ApiServerErrorResponse()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '获取登录算术验证码',
    description:
      '生成一题带有效期的算术 SVG 验证码，前端完成计算后再调用校验接口换取登录令牌。'
  })
  @ApiSuccessResponse({
    type: LoginCaptchaChallengeResponseDto,
    description: '算术验证码题面',
    dataExample: {
      captchaId: 'cpt_01JQ8J4S9P4X1N5P4D2M8E7T0A',
      captchaSvg: '<svg>...</svg>',
      prompt: '请计算图中算式结果',
      expiresAt: '2026-03-26T09:31:40.000Z'
    }
  })
  @Get('captcha/challenge')
  getLoginCaptchaChallenge() {
    return this.authService.createLoginCaptchaChallenge();
  }

  @ApiOperation({
    summary: '校验登录算术验证码',
    description:
      '校验验证码答案，成功后返回一次性 captchaToken，登录接口需携带该令牌才能继续完成认证。'
  })
  @ApiBody({ type: VerifyLoginCaptchaDto })
  @ApiSuccessResponse({
    type: VerifyLoginCaptchaResponseDto,
    description: '验证码校验结果',
    dataExample: {
      captchaToken: 'cap_01JQ8J6K4SZQ7X6MEY9R2QG3TN',
      expiresAt: '2026-03-26T09:32:10.000Z'
    }
  })
  @ApiErrorResponse({
    status: 401,
    description: '验证码校验失败',
    examples: [
      {
        name: 'captchaInvalid',
        code: BUSINESS_ERROR_CODES.AUTH_CAPTCHA_INVALID,
        summary: '验证码错误或已失效'
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '验证码校验参数错误',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Post('captcha/verify')
  verifyLoginCaptcha(@Body() dto: VerifyLoginCaptchaDto) {
    return this.authService.verifyLoginCaptcha(dto);
  }

  @ApiOperation({
    summary: '账号登录',
    description:
      '使用用户名、密码和验证码放行令牌登录，返回 Bearer Token 及当前用户权限摘要。'
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
      },
      {
        name: 'captchaRequired',
        code: BUSINESS_ERROR_CODES.AUTH_CAPTCHA_REQUIRED,
        summary: '请先完成验证码校验'
      },
      {
        name: 'captchaTokenInvalid',
        code: BUSINESS_ERROR_CODES.AUTH_CAPTCHA_TOKEN_INVALID,
        summary: '登录校验已失效，请重新完成验证码'
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
  login(@Body() dto: LoginDto, @Req() request: RequestLike) {
    return this.authService.login(dto, request);
  }

  @ApiOperation({
    summary: '退出登录',
    description:
      '当前接口用于记录退出登录安全审计事件。由于使用 Bearer Token，服务端不会维护会话状态。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    description: '退出登录结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
  })
  @ApiUnauthorizedErrorResponse({
    description: '登录态异常响应',
    examples: AUTH_UNAUTHORIZED_EXAMPLES
  })
  @ApiForbiddenErrorResponse({
    description: '当前登录态不可访问',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: JwtPayload, @Req() request: RequestLike) {
    return this.authService.logout(user, request);
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
    examples: AUTH_UNAUTHORIZED_EXAMPLES
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
    examples: AUTH_UNAUTHORIZED_EXAMPLES
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
    summary: '当前用户动态路由树',
    description:
      '返回当前登录用户可访问的前端动态路由树，仅包含目录和菜单节点，并自动补齐祖先路由节点。'
  })
  @ApiBearerAuth()
  @ApiSuccessResponse({
    type: AuthRouteItemResponseDto,
    isArray: true,
    description: '当前用户动态路由树',
    dataExample: [
      {
        path: '/system',
        name: 'system',
        component: 'LAYOUT',
        redirect: '/system/users',
        meta: {
          title: '系统管理',
          icon: 'folder',
          hidden: false,
          order: 1,
          menuKey: 'main_system',
          type: 1,
          layout: 'default'
        },
        children: [
          {
            path: '/system/users',
            name: 'systemUsers',
            component: 'system/users/index',
            meta: {
              title: '用户管理',
              icon: 'mdi:user',
              hidden: false,
              order: 10,
              menuKey: 'main_system_users',
              type: 2,
              keepAlive: true
            }
          }
        ]
      }
    ]
  })
  @ApiUnauthorizedErrorResponse({
    description: '登录态异常响应',
    examples: AUTH_UNAUTHORIZED_EXAMPLES
  })
  @ApiForbiddenErrorResponse({
    description: '当前登录态不可访问',
    examples: AUTH_RUNTIME_FORBIDDEN_EXAMPLES
  })
  @UseGuards(JwtAuthGuard)
  @Get('routes')
  routes(@CurrentUser() user: JwtPayload) {
    return this.authService.getRoutes(user);
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
    examples: AUTH_UNAUTHORIZED_EXAMPLES
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
