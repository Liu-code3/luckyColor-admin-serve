export interface AppEnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_URL: string;
  SWAGGER_ENABLED: boolean;
  LOGIN_CAPTCHA_ENABLED: boolean;
  TENANT_ENABLED: boolean;
  TENANT_HEADER: string;
  TENANT_DOMAIN_SUFFIX?: string;
  DEFAULT_TENANT_ID?: string;
  DEFAULT_ADMIN_USERNAME: string;
  DEFAULT_ADMIN_PASSWORD: string;
  APP_TIME_ZONE: string;
}

const DEFAULT_PORT = 3001;
const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
const DEFAULT_JWT_EXPIRES_IN = '2h';
const DEFAULT_SWAGGER_ENABLED = true;
const DEFAULT_LOGIN_CAPTCHA_ENABLED = false;
const DEFAULT_TENANT_HEADER = 'x-tenant-id';
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = '123456';
const DEFAULT_APP_TIME_ZONE = '+08:00';

export function validateEnvironment(
  rawConfig: Record<string, unknown>
): AppEnvironmentVariables {
  const nodeEnv = readOptionalString(rawConfig.NODE_ENV) ?? 'development';
  const port = readPort(rawConfig.PORT, DEFAULT_PORT);
  const databaseUrl = readRequiredString(rawConfig.DATABASE_URL, 'DATABASE_URL');
  const jwtSecret = readRequiredString(rawConfig.JWT_SECRET, 'JWT_SECRET');
  const jwtExpiresIn =
    readOptionalString(rawConfig.JWT_EXPIRES_IN) ?? DEFAULT_JWT_EXPIRES_IN;
  const redisUrl =
    readOptionalString(rawConfig.REDIS_URL) ?? DEFAULT_REDIS_URL;
  const swaggerEnabled = readBoolean(
    rawConfig.SWAGGER_ENABLED,
    'SWAGGER_ENABLED',
    DEFAULT_SWAGGER_ENABLED
  );
  const loginCaptchaEnabled = readBoolean(
    rawConfig.LOGIN_CAPTCHA_ENABLED,
    'LOGIN_CAPTCHA_ENABLED',
    DEFAULT_LOGIN_CAPTCHA_ENABLED
  );
  const tenantEnabled = readBoolean(
    rawConfig.TENANT_ENABLED,
    'TENANT_ENABLED',
    true
  );
  const tenantHeader =
    readOptionalString(rawConfig.TENANT_HEADER) ?? DEFAULT_TENANT_HEADER;
  const tenantDomainSuffix = readOptionalString(rawConfig.TENANT_DOMAIN_SUFFIX);
  const defaultTenantId = readOptionalString(rawConfig.DEFAULT_TENANT_ID);
  const defaultAdminUsername =
    readOptionalString(rawConfig.DEFAULT_ADMIN_USERNAME) ??
    DEFAULT_ADMIN_USERNAME;
  const defaultAdminPassword =
    readOptionalString(rawConfig.DEFAULT_ADMIN_PASSWORD) ??
    DEFAULT_ADMIN_PASSWORD;
  const appTimeZone =
    readOptionalString(rawConfig.APP_TIME_ZONE) ?? DEFAULT_APP_TIME_ZONE;

  ensureValidTenantHeader(tenantHeader);
  ensureValidDomainSuffix(tenantDomainSuffix);
  ensureValidSeedAdminUsername(defaultAdminUsername);
  ensureValidSeedAdminPassword(defaultAdminPassword);
  ensureValidTimeZoneOffset(appTimeZone);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    REDIS_URL: redisUrl,
    SWAGGER_ENABLED: swaggerEnabled,
    LOGIN_CAPTCHA_ENABLED: loginCaptchaEnabled,
    TENANT_ENABLED: tenantEnabled,
    TENANT_HEADER: tenantHeader,
    TENANT_DOMAIN_SUFFIX: tenantDomainSuffix || undefined,
    DEFAULT_TENANT_ID: defaultTenantId || undefined,
    DEFAULT_ADMIN_USERNAME: defaultAdminUsername,
    DEFAULT_ADMIN_PASSWORD: defaultAdminPassword,
    APP_TIME_ZONE: appTimeZone
  };
}

function readRequiredString(value: unknown, key: string) {
  const normalized = readOptionalString(value);

  if (!normalized) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return normalized;
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function readPort(value: unknown, fallback: number) {
  const normalized = readOptionalString(value);

  if (!normalized) {
    return fallback;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'Environment variable PORT must be an integer between 1 and 65535.'
    );
  }

  return port;
}

function readBoolean(value: unknown, key: string, fallback: boolean) {
  const normalized = readOptionalString(value);

  if (!normalized) {
    return fallback;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(
    `Environment variable ${key} must be either "true" or "false".`
  );
}

function ensureValidTenantHeader(headerName: string) {
  if (!/^[A-Za-z0-9-]+$/.test(headerName)) {
    throw new Error(
      'Environment variable TENANT_HEADER must be a valid HTTP header name.'
    );
  }
}

function ensureValidDomainSuffix(domainSuffix: string | null) {
  if (!domainSuffix) {
    return;
  }

  if (
    !/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/.test(domainSuffix) ||
    domainSuffix.startsWith('.') ||
    domainSuffix.endsWith('.') ||
    domainSuffix.includes(':')
  ) {
    throw new Error(
      'Environment variable TENANT_DOMAIN_SUFFIX must be a plain host suffix like example.com.'
    );
  }
}

function ensureValidTimeZoneOffset(timeZone: string) {
  if (!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(timeZone)) {
    throw new Error(
      'Environment variable APP_TIME_ZONE must be an offset like +08:00 or -05:30.'
    );
  }
}

function ensureValidSeedAdminUsername(username: string) {
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
    throw new Error(
      'Environment variable DEFAULT_ADMIN_USERNAME must be 3-32 characters and only include letters, numbers, dot, underscore or hyphen.'
    );
  }
}

function ensureValidSeedAdminPassword(password: string) {
  if (password.length < 6 || password.length > 128) {
    throw new Error(
      'Environment variable DEFAULT_ADMIN_PASSWORD must be between 6 and 128 characters.'
    );
  }
}
