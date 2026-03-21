import { Controller, Get } from '@nestjs/common';
import { successResponse } from '../common/api-response';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return successResponse(await this.healthService.check(), '健康检查成功');
  }
}
