import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { HealthModule } from './health/health.module';
import { MenusModule } from './menus/menus.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

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
