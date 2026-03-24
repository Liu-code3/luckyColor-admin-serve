import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { LoginDto } from './auth.dto';
import { AUTH_USER_ACCESS_INCLUDE, type AuthUserRecord } from './auth.types';

@Injectable()
export class AuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly passwordService: PasswordService
  ) {}

  async authenticate(dto: LoginDto) {
    const tenantId = this.resolveLoginTenantId();
    const user = await this.resolveLoginAccount(tenantId, dto.username);

    this.assertAccountStatus(user);

    const passwordHash = await this.verifyPassword(user, dto.password);

    return this.markLoginSuccess(user, passwordHash);
  }

  private resolveLoginTenantId() {
    return this.tenantScope.requireTenantId();
  }

  private resolveLoginAccount(tenantId: string, username: string) {
    return this.prisma.user.findFirst({
      where: this.tenantScope.buildWhereForTenant(
        { username },
        tenantId,
        'tenantId'
      ),
      include: AUTH_USER_ACCESS_INCLUDE
    });
  }

  private assertAccountStatus(
    user: AuthUserRecord | null
  ): asserts user is AuthUserRecord {
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
    }

    if (!user.status) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED);
    }
  }

  private async verifyPassword(user: AuthUserRecord, rawPassword: string) {
    if (!this.passwordService.isHash(user.password)) {
      if (user.password !== rawPassword) {
        throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
      }

      return this.passwordService.hash(rawPassword);
    }

    const isPasswordValid = await this.passwordService.verify(
      user.password,
      rawPassword
    );

    if (!isPasswordValid) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
    }

    return null;
  }

  private async markLoginSuccess(
    user: AuthUserRecord,
    passwordHash: string | null
  ) {
    const lastLoginAt = new Date();
    await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        ...(passwordHash
          ? {
              password: passwordHash
            }
          : {}),
        lastLoginAt
      }
    });

    return {
      ...user,
      password: passwordHash ?? user.password,
      lastLoginAt
    };
  }
}
