import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { AuthLoginService } from './auth-login.service';

describe('AuthLoginService', () => {
  const createTenantScope = (tenantId: string | null = 'tenant_001') =>
    new TenantPrismaScopeService({
      getTenantId: jest.fn().mockReturnValue(tenantId)
    } as never);

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    tenantId: 'tenant_001',
    username: 'admin',
    password: '123456',
    nickname: '系统管理员',
    status: true,
    lastLoginAt: null,
    createdAt: new Date('2026-03-22T14:30:00.000Z'),
    updatedAt: new Date('2026-03-22T14:30:00.000Z'),
    roles: [],
    ...overrides
  });

  function createService(tenantId: string | null = 'tenant_001') {
    const prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn()
      }
    };
    const passwordService = {
      isHash: jest.fn().mockReturnValue(true),
      hash: jest.fn().mockResolvedValue('hashed-password'),
      verify: jest.fn().mockResolvedValue(true)
    };

    return {
      service: new AuthLoginService(
        prisma as never,
        createTenantScope(tenantId),
        passwordService as never
      ),
      prisma,
      passwordService
    };
  }

  it('throws when login tenant context is missing', async () => {
    const { service } = createService(null);

    await expect(
      service.authenticate({
        username: 'admin',
        password: '123456'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED)
    );
  });

  it('loads account within current tenant scope only', async () => {
    const { service, prisma, passwordService } = createService('tenant_002');
    prisma.user.findFirst.mockResolvedValue(
      createUser({
        tenantId: 'tenant_002',
        password: 'hashed-password'
      })
    );

    const user = await service.authenticate({
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
    expect(passwordService.verify).toHaveBeenCalledWith(
      'hashed-password',
      '123456'
    );
    expect(user.tenantId).toBe('tenant_002');
  });

  it('throws login failed when account does not exist under current tenant', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.authenticate({
        username: 'admin',
        password: '123456'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED)
    );
  });

  it('throws when account is disabled before password verification', async () => {
    const { service, prisma, passwordService } = createService();
    prisma.user.findFirst.mockResolvedValue(
      createUser({
        status: false
      })
    );

    await expect(
      service.authenticate({
        username: 'admin',
        password: '123456'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED)
    );
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('throws login failed when password verification fails', async () => {
    const { service, prisma, passwordService } = createService();
    prisma.user.findFirst.mockResolvedValue(
      createUser({
        password: 'hashed-password'
      })
    );
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.authenticate({
        username: 'admin',
        password: 'wrong-password'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED)
    );
  });
});
