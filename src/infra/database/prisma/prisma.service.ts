import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import { AppConfigService } from '../../../shared/config/app-config.service';
import { buildSetDatabaseTimeZoneSql } from '../../../shared/time/database-timezone';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly appConfig: AppConfigService) {
    super({
      log: appConfig.isDevelopment ? ['warn', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.$executeRawUnsafe(
      buildSetDatabaseTimeZoneSql(this.appConfig.databaseTimeZone)
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
