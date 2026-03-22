import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../../shared/api/api-response';
import { buildSuccessResponseSchema } from '../../../shared/swagger/swagger-response';
import { HealthService } from './health.service';

@ApiTags('平台能力 / 健康检查')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: '健康检查',
    description: '检查服务与数据库连接状态'
  })
  @ApiOkResponse(
    buildSuccessResponseSchema(
      {
        status: 'ok',
        timestamp: '2026-03-22T14:30:00.000Z',
        database: 'up'
      },
      '健康检查成功'
    )
  )
  @Get()
  async check() {
    return successResponse(await this.healthService.check());
  }
}
