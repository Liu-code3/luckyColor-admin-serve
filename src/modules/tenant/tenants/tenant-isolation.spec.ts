import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { AppConfigService } from '../../../shared/config/app-config.service';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthLoginService } from '../../iam/auth/auth-login.service';
import { AuthService } from '../../iam/auth/auth.service';
import { DataScopeService } from '../../iam/data-scopes/data-scope.service';
import { JwtStrategy } from '../../iam/auth/jwt.strategy';
import { UsersService } from '../../system/users/users.service';

describe('Tenant isolation regression', () => {
  const createTenantScope = (tenantId = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  it('allows the same username under different tenants by binding login to current tenant scope', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-2',
          tenantId: 'tenant_002',
          username: 'admin',
          password: '123456',
          nickname: 'Tenant 2 Admin',
          status: true,
          roles: []
        }),
        update: jest.fn()
      }
    };
    const passwordService = {
      isHash: jest.fn().mockReturnValue(true),
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(true)
    };
    const service = new AuthService(
      prisma as never,
      {
        signAsync: jest.fn().mockResolvedValue('tenant-2-token')
      } as unknown as JwtService,
      {
        jwtExpiresIn: '2h'
      } as unknown as AppConfigService,
      {
        consumeLoginCaptchaToken: jest.fn().mockResolvedValue(undefined)
      } as never,
      new AuthLoginService(
        prisma as never,
        createTenantScope('tenant_002'),
        passwordService as unknown as PasswordService
      ) as never,
      {
        recordLoginSuccess: jest.fn().mockResolvedValue(undefined),
        recordLoginFailure: jest.fn().mockResolvedValue(undefined),
        recordLogout: jest.fn().mockResolvedValue(undefined)
      } as never
    );

    const response = await service.login({
      username: 'admin',
      password: '123456'
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ username: 'admin' }, { tenantId: 'tenant_002' }]
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true
                  }
                }
              }
            }
          }
        }
      }
    });
    expect(response.data.user).toEqual({
      id: 'user-2',
      tenantId: 'tenant_002',
      username: 'admin',
      nickname: 'Tenant 2 Admin',
      roleCodes: [],
      menuCodeList: [],
      buttonCodeList: []
    });
  });

  it('blocks cross-tenant user reads by enforcing tenantId on service queries', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };
    const service = new UsersService(
      prisma as never,
      createTenantScope('tenant_001'),
      {
        hash: jest.fn()
      } as unknown as PasswordService,
      {
        buildUserWhere: jest
          .fn()
          .mockImplementation(async (_user, where) => where)
      } as unknown as DataScopeService
    );

    await expect(service.detail('user-from-tenant-002')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND)
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: 'user-from-tenant-002' }, { tenantId: 'tenant_001' }]
      },
      include: {
        department: true
      }
    });
  });

  it('does not allow admin-style tenant bypass when header tenant and token tenant differ', async () => {
    const strategy = new JwtStrategy(
      {
        jwtSecret: 'jwt-secret'
      } as unknown as AppConfigService,
      {
        user: {
          findFirst: jest.fn()
        }
      } as never,
      {
        getTenantId: jest.fn().mockReturnValue('tenant_002'),
        setTenant: jest.fn()
      } as never,
      {
        assertActiveTenant: jest.fn()
      } as never
    );

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED)
    );
  });
});
