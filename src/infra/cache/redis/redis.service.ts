import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379',
      {
        lazyConnect: true,
        maxRetriesPerRequest: 1
      }
    );
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
