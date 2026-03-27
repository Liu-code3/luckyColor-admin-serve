import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import svgCaptcha from 'svg-captcha';
import { RedisService } from '../../../infra/cache/redis/redis.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AppConfigService } from '../../../shared/config/app-config.service';
import { VerifyLoginCaptchaDto } from './auth.dto';

const LOGIN_CAPTCHA_PROMPT = '\u8bf7\u8ba1\u7b97\u56fe\u4e2d\u7b97\u5f0f\u7ed3\u679c';
const CAPTCHA_CHALLENGE_TTL_SECONDS = 90;
const CAPTCHA_TOKEN_TTL_SECONDS = 120;
const CAPTCHA_CHALLENGE_KEY_PREFIX = 'auth:login-captcha:challenge:';
const CAPTCHA_TOKEN_KEY_PREFIX = 'auth:login-captcha:token:';

interface LoginCaptchaChallengeCachePayload {
  tenantId: string;
  answer: string;
  prompt: string;
  issuedAt: string;
}

interface LoginCaptchaTokenCachePayload {
  tenantId: string;
  captchaId: string;
  issuedAt: string;
}

@Injectable()
export class AuthCaptchaService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly redisService: RedisService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  async createLoginCaptchaChallenge() {
    const tenantId = this.tenantScope.requireTenantId();
    const challenge = svgCaptcha.createMathExpr({
      mathMin: 1,
      mathMax: 20,
      mathOperator: '+-',
      noise: 2,
      color: true,
      background: '#f8fafc',
      width: 180,
      height: 64,
      fontSize: 44
    });
    const captchaId = `cpt_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = this.createExpiresAt(CAPTCHA_CHALLENGE_TTL_SECONDS);

    await this.setJson(
      this.getChallengeKey(captchaId),
      {
        tenantId,
        answer: String(challenge.text).trim(),
        prompt: LOGIN_CAPTCHA_PROMPT,
        issuedAt: new Date().toISOString()
      } satisfies LoginCaptchaChallengeCachePayload,
      CAPTCHA_CHALLENGE_TTL_SECONDS
    );

    return {
      captchaId,
      captchaSvg: challenge.data,
      prompt: LOGIN_CAPTCHA_PROMPT,
      expiresAt
    };
  }

  async verifyLoginCaptcha(dto: VerifyLoginCaptchaDto) {
    const tenantId = this.tenantScope.requireTenantId();
    const challengeKey = this.getChallengeKey(dto.captchaId);
    const cached = await this.getJson<LoginCaptchaChallengeCachePayload>(
      challengeKey
    );

    if (!cached || cached.tenantId !== tenantId) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_CAPTCHA_INVALID);
    }

    await this.deleteKey(challengeKey);

    if (cached.answer !== dto.answer.trim()) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_CAPTCHA_INVALID);
    }

    const captchaToken = `cap_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = this.createExpiresAt(CAPTCHA_TOKEN_TTL_SECONDS);

    await this.setJson(
      this.getTokenKey(captchaToken),
      {
        tenantId,
        captchaId: dto.captchaId,
        issuedAt: new Date().toISOString()
      } satisfies LoginCaptchaTokenCachePayload,
      CAPTCHA_TOKEN_TTL_SECONDS
    );

    return {
      captchaToken,
      expiresAt
    };
  }

  async consumeLoginCaptchaToken(captchaToken?: string) {
    if (!this.appConfig.loginCaptchaEnabled) {
      return;
    }

    const normalizedToken = captchaToken?.trim();
    if (!normalizedToken) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_CAPTCHA_REQUIRED);
    }

    const tenantId = this.tenantScope.requireTenantId();
    const tokenKey = this.getTokenKey(normalizedToken);
    const cached = await this.getJson<LoginCaptchaTokenCachePayload>(tokenKey);

    if (!cached || cached.tenantId !== tenantId) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.AUTH_CAPTCHA_TOKEN_INVALID
      );
    }

    await this.deleteKey(tokenKey);
  }

  private createExpiresAt(ttlSeconds: number) {
    return new Date(Date.now() + ttlSeconds * 1000).toISOString();
  }

  private getChallengeKey(captchaId: string) {
    return `${CAPTCHA_CHALLENGE_KEY_PREFIX}${captchaId}`;
  }

  private getTokenKey(captchaToken: string) {
    return `${CAPTCHA_TOKEN_KEY_PREFIX}${captchaToken}`;
  }

  private async ensureRedisClient() {
    const client = this.redisService.getClient();

    if (client.status === 'wait') {
      await client.connect();
    }

    return client;
  }

  private async setJson(key: string, value: unknown, ttlSeconds: number) {
    const client = await this.ensureRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  private async getJson<T>(key: string) {
    const client = await this.ensureRedisClient();
    const raw = await client.get(key);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      await client.del(key);
      return null;
    }
  }

  private async deleteKey(key: string) {
    const client = await this.ensureRedisClient();
    await client.del(key);
  }
}
