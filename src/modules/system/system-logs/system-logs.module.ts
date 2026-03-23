import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../../iam/auth/auth.module';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogInterceptor } from './system-log.interceptor';
import { SystemLogsService } from './system-logs.service';

@Module({
  imports: [AuthModule],
  controllers: [SystemLogsController],
  providers: [
    SystemLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SystemLogInterceptor
    }
  ]
})
export class SystemLogsModule {}
