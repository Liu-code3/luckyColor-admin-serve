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
  type PermissionBoundary,
  type PermissionMatchMode,
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
      summary: '褰撳墠璐﹀彿瑙掕壊宸插け鏁?'
    },
    {
      name: 'tenantDisabled',
      code: BUSINESS_ERROR_CODES.TENANT_DISABLED,
      summary: '褰撳墠绉熸埛宸茶绂佺敤'
    },
    {
      name: 'tenantExpired',
      code: BUSINESS_ERROR_CODES.TENANT_EXPIRED,
      summary: '褰撳墠绉熸埛宸茶繃鏈?'
    },
    {
      name: 'tenantFrozen',
      code: BUSINESS_ERROR_CODES.TENANT_FROZEN,
      summary: '褰撳墠绉熸埛宸茶鍐荤粨'
    },
    {
      name: 'tenantAccessDenied',
      code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED,
      summary: '褰撳墠璐﹀彿涓嶈兘璁块棶璇ョ鎴?'
    }
  ];
}

function createPermissionDecorator(config: {
  permissions: string[];
  mode: PermissionMatchMode;
  denialCode: number;
  denialName: string;
  denialSummary: string;
  boundary?: PermissionBoundary;
}) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedErrorResponse({
      description: '鐧诲綍鎬佸紓甯稿搷搴?',
      examples: [
        {
          name: 'tokenExpired',
          code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
          summary: '鐧诲綍宸茶繃鏈?'
        },
        {
          name: 'tokenInvalid',
          code: BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID,
          summary: '鐧诲綍鐘舵€佹棤鏁?'
        }
      ]
    }),
    ApiForbiddenErrorResponse({
      description: '褰撳墠璐﹀彿娌℃湁璁块棶璇ユ帴鍙ｇ殑鏉冮檺',
      examples: createForbiddenExamples(
        config.denialCode,
        config.denialName,
        config.denialSummary
      )
    }),
    UseGuards(JwtAuthGuard, PermissionGuard),
    SetMetadata(PERMISSION_METADATA, {
      permissions: config.permissions,
      mode: config.mode,
      boundary: config.boundary ?? 'ANY',
      denialCode: config.denialCode
    } satisfies PermissionRequirement)
  );
}

export function RequirePermissions(...permissions: string[]) {
  return createPermissionDecorator({
    permissions,
    mode: 'ANY',
    denialCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
    denialName: 'permissionDenied',
    denialSummary: '褰撳墠璐﹀彿娌℃湁姝ゆ搷浣滄潈闄?'
  });
}

export function RequireAllPermissions(...permissions: string[]) {
  return createPermissionDecorator({
    permissions,
    mode: 'ALL',
    denialCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
    denialName: 'permissionDenied',
    denialSummary: '褰撳墠璐﹀彿娌℃湁姝ゆ搷浣滄潈闄?'
  });
}

export function RequireMenuPermission(...permissions: string[]) {
  return createPermissionDecorator({
    permissions,
    mode: 'ANY',
    denialCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED,
    denialName: 'menuPermissionDenied',
    denialSummary: '褰撳墠璐﹀彿娌℃湁姝よ彍鍗曟潈闄?'
  });
}

export function RequirePlatformMenuPermission(...permissions: string[]) {
  return createPermissionDecorator({
    permissions,
    mode: 'ANY',
    boundary: 'PLATFORM_ADMIN',
    denialCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED,
    denialName: 'menuPermissionDenied',
    denialSummary: '褰撳墠璐﹀彿娌℃湁骞冲彴绠＄悊渚ц彍鍗曟潈闄?'
  });
}
