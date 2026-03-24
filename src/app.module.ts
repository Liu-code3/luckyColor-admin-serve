import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infra/cache/redis/redis.module';
import { PrismaModule } from './infra/database/prisma/prisma.module';
import { PasswordModule } from './infra/security/password.module';
import { TenantModule } from './infra/tenancy/tenant.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { DataScopesModule } from './modules/iam/data-scopes/data-scopes.module';
import { PermissionsModule } from './modules/iam/permissions/permissions.module';
import { DashboardModule } from './modules/platform/dashboard/dashboard.module';
import { FileModule } from './modules/platform/file/file.module';
import { HealthModule } from './modules/platform/health/health.module';
import { ConfigsModule } from './modules/system/configs/configs.module';
import { DepartmentsModule } from './modules/system/departments/departments.module';
import { DictionaryModule } from './modules/system/dictionary/dictionary.module';
import { MenusModule } from './modules/system/menus/menus.module';
import { NoticesModule } from './modules/system/notices/notices.module';
import { RolesModule } from './modules/system/roles/roles.module';
import { SystemLogsModule } from './modules/system/system-logs/system-logs.module';
import { UsersModule } from './modules/system/users/users.module';
import { TenantPackagesModule } from './modules/tenant/tenant-packages/tenant-packages.module';
import { TenantsModule } from './modules/tenant/tenants/tenants.module';
import { AppConfigModule } from './shared/config/app-config.module';
import { validateEnvironment } from './shared/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment
    }),
    AppConfigModule,
    RedisModule,
    PrismaModule,
    PasswordModule,
    TenantModule,
    TenantPackagesModule,
    TenantsModule,
    AuthModule,
    DataScopesModule,
    PermissionsModule,
    DashboardModule,
    ConfigsModule,
    DepartmentsModule,
    DictionaryModule,
    FileModule,
    HealthModule,
    NoticesModule,
    RolesModule,
    SystemLogsModule,
    UsersModule,
    MenusModule
  ]
})
export class AppModule {}
