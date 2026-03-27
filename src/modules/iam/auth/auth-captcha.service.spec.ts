import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthCaptchaService } from './auth-captcha.service';

const PROMPT_TEXT = '\u8bf7\u8ba1\u7b97\u56fe\u4e2d\u7b97\u5f0f\u7ed3\u679c';

describe('AuthCaptchaService', () => {
  const createTenantScope = (tenantId: string | null = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  function createService(options?: {
    tenantId?: string | null;
    loginCaptchaEnabled?: boolean;
    status?: 'wait' | 'ready';
  }) {
    const redisClient = {
      status: options?.status ?? 'ready',
      connect: jest.fn().mockImplementation(async () => {
        redisClient.status = 'ready';
      }),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1)
    };
    const redisService = {
      getClient: jest.fn().mockReturnValue(redisClient)
    };
    const appConfig = {
      loginCaptchaEnabled: options?.loginCaptchaEnabled ?? true
    };

    return {
      service: new AuthCaptchaService(
        appConfig as never,
        redisService as never,
        createTenantScope(options?.tenantId ?? 'tenant_001')
      ),
      redisClient
    };
  }

  it('creates an arithmetic captcha challenge under current tenant', async () => {
    const { service, redisClient } = createService({ status: 'wait' });

    const result = await service.createLoginCaptchaChallenge();

    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect(result.captchaId).toMatch(/^cpt_/);
    expect(result.prompt).toBe(PROMPT_TEXT);
    expect(result.captchaSvg).toContain('<svg');
    expect(result.expiresAt).toEqual(expect.any(String));
    expect(redisClient.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:login-captcha:challenge:cpt_/),
      expect.stringContaining('"tenantId":"tenant_001"'),
      'EX',
      90
    );
  });

  it('verifies captcha answer and issues one-time login token', async () => {
    const { service, redisClient } = createService();
    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        tenantId: 'tenant_001',
        answer: '13',
        prompt: PROMPT_TEXT,
        issuedAt: '2026-03-26T09:30:00.000Z'
      })
    );

    const result = await service.verifyLoginCaptcha({
      captchaId: 'cpt_demo',
      answer: '13'
    });

    expect(redisClient.get).toHaveBeenCalledWith(
      'auth:login-captcha:challenge:cpt_demo'
    );
    expect(redisClient.del).toHaveBeenCalledWith(
      'auth:login-captcha:challenge:cpt_demo'
    );
    expect(result.captchaToken).toMatch(/^cap_/);
    expect(redisClient.set).toHaveBeenLastCalledWith(
      expect.stringMatching(/^auth:login-captcha:token:cap_/),
      expect.stringContaining('"captchaId":"cpt_demo"'),
      'EX',
      120
    );
  });

  it('rejects wrong captcha answer and invalidates the old challenge', async () => {
    const { service, redisClient } = createService();
    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        tenantId: 'tenant_001',
        answer: '13',
        prompt: PROMPT_TEXT,
        issuedAt: '2026-03-26T09:30:00.000Z'
      })
    );

    await expect(
      service.verifyLoginCaptcha({
        captchaId: 'cpt_demo',
        answer: '14'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_CAPTCHA_INVALID)
    );

    expect(redisClient.del).toHaveBeenCalledWith(
      'auth:login-captcha:challenge:cpt_demo'
    );
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it('consumes captcha token when login captcha is enabled', async () => {
    const { service, redisClient } = createService({
      loginCaptchaEnabled: true
    });
    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        tenantId: 'tenant_001',
        captchaId: 'cpt_demo',
        issuedAt: '2026-03-26T09:30:00.000Z'
      })
    );

    await expect(
      service.consumeLoginCaptchaToken('cap_demo')
    ).resolves.toBeUndefined();

    expect(redisClient.get).toHaveBeenCalledWith(
      'auth:login-captcha:token:cap_demo'
    );
    expect(redisClient.del).toHaveBeenCalledWith(
      'auth:login-captcha:token:cap_demo'
    );
  });

  it('requires captcha token when login captcha is enabled', async () => {
    const { service } = createService({
      loginCaptchaEnabled: true
    });

    await expect(service.consumeLoginCaptchaToken()).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_CAPTCHA_REQUIRED)
    );
  });

  it('skips captcha token enforcement when feature is disabled', async () => {
    const { service, redisClient } = createService({
      loginCaptchaEnabled: false
    });

    await expect(service.consumeLoginCaptchaToken()).resolves.toBeUndefined();
    expect(redisClient.get).not.toHaveBeenCalled();
  });
});
