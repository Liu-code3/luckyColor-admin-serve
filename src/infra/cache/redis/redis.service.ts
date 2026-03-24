import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../../../shared/config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly appConfig: AppConfigService) {
    this.client = new Redis(this.appConfig.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
  }

  getClient() {
    return this.client;
  }

  async ping() {
    return this.client.ping();
  }

  async onModuleDestroy() {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
