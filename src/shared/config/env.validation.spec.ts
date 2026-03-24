import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('fills supported defaults and normalizes optional values', () => {
    const env = validateEnvironment({
      DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
      JWT_SECRET: 'test-secret'
    });

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '2h',
      REDIS_URL: 'redis://127.0.0.1:6379',
      TENANT_ENABLED: true,
      TENANT_HEADER: 'x-tenant-id',
      TENANT_DOMAIN_SUFFIX: undefined,
      DEFAULT_TENANT_ID: undefined,
      APP_TIME_ZONE: '+08:00'
    });
  });

  it('rejects missing required variables', () => {
    expect(() =>
      validateEnvironment({
        JWT_SECRET: 'test-secret'
      })
    ).toThrow('Environment variable DATABASE_URL is required.');

    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test'
      })
    ).toThrow('Environment variable JWT_SECRET is required.');
  });

  it('rejects invalid port, tenant flag and time zone values', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
        JWT_SECRET: 'test-secret',
        PORT: '70000'
      })
    ).toThrow(
      'Environment variable PORT must be an integer between 1 and 65535.'
    );

    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
        JWT_SECRET: 'test-secret',
        TENANT_ENABLED: 'enabled'
      })
    ).toThrow(
      'Environment variable TENANT_ENABLED must be either "true" or "false".'
    );

    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
        JWT_SECRET: 'test-secret',
        TENANT_DOMAIN_SUFFIX: 'tenant.example.com:3001'
      })
    ).toThrow(
      'Environment variable TENANT_DOMAIN_SUFFIX must be a plain host suffix like example.com.'
    );

    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/test',
        JWT_SECRET: 'test-secret',
        APP_TIME_ZONE: 'Asia/Shanghai'
      })
    ).toThrow(
      'Environment variable APP_TIME_ZONE must be an offset like +08:00 or -05:30.'
    );
  });
});
