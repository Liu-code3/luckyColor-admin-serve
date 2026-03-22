import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infra/database/prisma/prisma.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { HealthModule } from './modules/platform/health/health.module';
import { DictionaryModule } from './modules/system/dictionary/dictionary.module';
import { MenusModule } from './modules/system/menus/menus.module';
import { UsersModule } from './modules/system/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    AuthModule,
    DictionaryModule,
    HealthModule,
    UsersModule,
    MenusModule
  ]
})
export class AppModule {}
