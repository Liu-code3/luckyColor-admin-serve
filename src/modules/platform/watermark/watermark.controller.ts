import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { CurrentVisibleWatermarkResponseDto } from './watermark.response.dto';
import { WatermarkService } from './watermark.service';

@ApiTags('平台能力 / 水印配置')
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
@Controller('watermark')
export class WatermarkController {
  constructor(private readonly watermarkService: WatermarkService) {}

  @ApiOperation({
    summary: '读取当前可见水印配置',
    description:
      '返回当前用户最终可见的水印配置，结果已综合租户套餐、系统开关、系统配置和租户覆盖规则。'
  })
  @ApiSuccessResponse({
    type: CurrentVisibleWatermarkResponseDto,
    description: '当前可见的水印配置',
    dataExample: {
      enabled: true,
      content: '租户 001 内部资料',
      opacity: 0.12,
      color: '#334155',
      fontSize: 18,
      rotation: -20,
      source: 'TENANT'
    }
  })
  @Get('current')
  current(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.watermarkService.current(user);
  }
}
