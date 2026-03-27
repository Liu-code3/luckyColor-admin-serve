import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { CurrentUser } from '../../iam/auth/current-user.decorator';
import { JwtAuthGuard } from '../../iam/auth/jwt-auth.guard';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { SaveUserPreferencesDto } from './preferences.dto';
import { CurrentUserPreferenceResponseDto } from './preferences.response.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('平台能力 / 用户偏好')
@ApiServerErrorResponse()
@ApiUnauthorizedErrorResponse()
@ApiForbiddenErrorResponse({
  description: '当前登录态无权访问目标租户上下文',
  examples: [
    {
      name: 'tenantDisabled',
      code: BUSINESS_ERROR_CODES.TENANT_DISABLED
    },
    {
      name: 'tenantExpired',
      code: BUSINESS_ERROR_CODES.TENANT_EXPIRED
    },
    {
      name: 'tenantFrozen',
      code: BUSINESS_ERROR_CODES.TENANT_FROZEN
    },
    {
      name: 'tenantAccessDenied',
      code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED
    }
  ]
})
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @ApiOperation({
    summary: '读取当前用户偏好',
    description:
      '读取当前用户的布局、主题、暗黑模式、全屏和标签页等偏好快照。'
  })
  @ApiSuccessResponse({
    type: CurrentUserPreferenceResponseDto,
    description: '当前用户偏好',
    dataExample: {
      userId: 'clxuser1234567890',
      layout: 'side',
      theme: 'default',
      darkMode: false,
      fullscreen: false,
      tabPreferences: {
        enabled: true,
        persist: true,
        showIcon: true,
        draggable: true
      },
      createdAt: '2026-03-25T08:00:00.000Z',
      updatedAt: '2026-03-25T08:30:00.000Z'
    }
  })
  @Get('me')
  detail(@CurrentUser() user: JwtPayload) {
    return this.preferencesService.detail(user);
  }

  @ApiOperation({
    summary: '保存当前用户偏好',
    description:
      '保存当前用户的布局、主题、暗黑模式、全屏和标签页偏好，用于前端个性化渲染。'
  })
  @ApiBody({
    type: SaveUserPreferencesDto
  })
  @ApiSuccessResponse({
    type: CurrentUserPreferenceResponseDto,
    description: '保存后的当前用户偏好',
    dataExample: {
      userId: 'clxuser1234567890',
      layout: 'mix',
      theme: 'ocean',
      darkMode: true,
      fullscreen: false,
      tabPreferences: {
        enabled: true,
        persist: true,
        showIcon: false,
        draggable: true
      },
      createdAt: '2026-03-25T08:00:00.000Z',
      updatedAt: '2026-03-25T08:30:00.000Z'
    }
  })
  @Put('me')
  save(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SaveUserPreferencesDto
  ) {
    return this.preferencesService.save(user, dto);
  }
}
