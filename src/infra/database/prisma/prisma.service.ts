import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.$executeRawUnsafe("SET time_zone = '+08:00'");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
