import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../../shared/api/api-response';
import {
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { HealthStatusResponseDto } from './health.response.dto';
import { HealthService } from './health.service';

@ApiTags('平台能力 / 健康检查')
@ApiServerErrorResponse()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: '健康检查',
    description: '检查服务与数据库连接状态。'
  })
  @ApiSuccessResponse({
    type: HealthStatusResponseDto,
    description: '健康检查响应',
    dataExample: {
      status: 'ok',
      timestamp: '2026-03-22T14:30:00.000Z',
      database: 'up'
    }
  })
  @Get()
  async check() {
    return successResponse(await this.healthService.check());
  }
}
