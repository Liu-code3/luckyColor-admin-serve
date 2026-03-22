import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import { buildSetDatabaseTimeZoneSql } from '../../../shared/time/database-timezone';

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
    await this.$executeRawUnsafe(buildSetDatabaseTimeZoneSql());
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
