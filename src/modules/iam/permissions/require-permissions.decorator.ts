import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiForbiddenErrorResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from './permission-guard';
import {
  PERMISSION_METADATA,
  type PermissionRequirement
} from './permissions.constants';

function createForbiddenExamples(
  denialCode: number,
  denialName: string,
  denialSummary: string
) {
  return [
    {
      name: denialName,
      code: denialCode,
      summary: denialSummary
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
}

export function RequirePermissions(...permissions: string[]) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedErrorResponse({
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
    }),
    ApiForbiddenErrorResponse({
      description: '当前账号没有访问该接口的权限',
      examples: createForbiddenExamples(
        BUSINESS_ERROR_CODES.PERMISSION_DENIED,
        'permissionDenied',
        '当前账号没有此操作权限'
      )
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions,
      mode: 'ANY',
      denialCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED
    } satisfies PermissionRequirement)
  );
}

export function RequireAllPermissions(...permissions: string[]) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedErrorResponse({
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
    }),
    ApiForbiddenErrorResponse({
      description: '当前账号没有访问该接口的权限',
      examples: createForbiddenExamples(
        BUSINESS_ERROR_CODES.PERMISSION_DENIED,
        'permissionDenied',
        '当前账号没有此操作权限'
      )
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions,
      mode: 'ALL',
      denialCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED
    } satisfies PermissionRequirement)
  );
}

export function RequireMenuPermission(...permissions: string[]) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedErrorResponse({
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
    }),
    ApiForbiddenErrorResponse({
      description: '当前账号没有访问该菜单的权限',
      examples: createForbiddenExamples(
        BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED,
        'menuPermissionDenied',
        '当前账号没有此菜单权限'
      )
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions,
      mode: 'ANY',
      denialCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED
    } satisfies PermissionRequirement)
  );
}
