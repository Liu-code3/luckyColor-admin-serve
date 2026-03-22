import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infra/cache/redis/redis.module';
import { PrismaModule } from './infra/database/prisma/prisma.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { FileModule } from './modules/platform/file/file.module';
import { HealthModule } from './modules/platform/health/health.module';
import { DictionaryModule } from './modules/system/dictionary/dictionary.module';
import { DepartmentsModule } from './modules/system/departments/departments.module';
import { MenusModule } from './modules/system/menus/menus.module';
import { RolesModule } from './modules/system/roles/roles.module';
import { UsersModule } from './modules/system/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    RedisModule,
    PrismaModule,
    AuthModule,
    DepartmentsModule,
    DictionaryModule,
    FileModule,
    HealthModule,
    RolesModule,
    UsersModule,
    MenusModule
  ]
})
export class AppModule {}
