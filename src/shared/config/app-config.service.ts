import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnvironmentVariables } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv() {
    return this.getOrThrow('NODE_ENV');
  }

  get isDevelopment() {
    return this.nodeEnv === 'development';
  }

  get port() {
    return this.getOrThrow('PORT');
  }

  get databaseUrl() {
    return this.getOrThrow('DATABASE_URL');
  }

  get databaseTimeZone() {
    return this.getOrThrow('APP_TIME_ZONE');
  }

  get jwtSecret() {
    return this.getOrThrow('JWT_SECRET');
  }

  get jwtExpiresIn() {
    return this.getOrThrow('JWT_EXPIRES_IN');
  }

  get redisUrl() {
    return this.getOrThrow('REDIS_URL');
  }

  get tenantEnabled() {
    return this.getOrThrow('TENANT_ENABLED');
  }

  get tenantHeader() {
    return this.getOrThrow('TENANT_HEADER');
  }

  get tenantDomainSuffix() {
    return this.configService.get<string>('TENANT_DOMAIN_SUFFIX') ?? null;
  }

  get defaultTenantId() {
    return this.configService.get<string>('DEFAULT_TENANT_ID') ?? null;
  }

  private getOrThrow<Key extends keyof AppEnvironmentVariables>(key: Key) {
    return this.configService.getOrThrow<AppEnvironmentVariables[Key]>(key);
  }
}
