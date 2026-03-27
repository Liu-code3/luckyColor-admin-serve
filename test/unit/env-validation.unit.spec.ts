import { validateEnvironment } from '../../src/shared/config/env.validation';

describe('unit sample', () => {
  it('validates required env and fills defaults', () => {
    const result = validateEnvironment({
      DATABASE_URL: 'mysql://root:123456@127.0.0.1:3306/luckycolor_admin',
      JWT_SECRET: 'unit-test-secret'
    });

    expect(result.PORT).toBe(3001);
    expect(result.SWAGGER_ENABLED).toBe(true);
    expect(result.LOGIN_CAPTCHA_ENABLED).toBe(false);
    expect(result.TENANT_ENABLED).toBe(true);
    expect(result.TENANT_HEADER).toBe('x-tenant-id');
    expect(result.DEFAULT_ADMIN_USERNAME).toBe('admin');
    expect(result.DEFAULT_ADMIN_PASSWORD).toBe('123456');
  });
});
