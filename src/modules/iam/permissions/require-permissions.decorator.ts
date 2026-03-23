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
      examples: [
        {
          name: 'permissionDenied',
          code: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
          summary: '当前账号没有此操作权限'
        }
      ]
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions,
      mode: 'ANY'
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
      examples: [
        {
          name: 'permissionDenied',
          code: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
          summary: '当前账号没有此操作权限'
        }
      ]
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions,
      mode: 'ALL'
    } satisfies PermissionRequirement)
  );
}
