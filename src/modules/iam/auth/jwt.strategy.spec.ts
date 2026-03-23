import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  function createStrategy(currentTenantId: string | null = null) {
    const configService = {
      get: jest.fn().mockReturnValue('jwt-secret')
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          status: true,
          roles: [{ role: { status: true } }]
        })
      }
    };
    const tenantContext = {
      getTenantId: jest.fn().mockReturnValue(currentTenantId),
      setTenant: jest.fn()
    };
    const tenantAccess = {
      assertActiveTenant: jest.fn().mockResolvedValue({
        id: 'tenant_001',
        status: 'ACTIVE'
      })
    };

    return {
      strategy: new JwtStrategy(
        configService as never,
        prisma as never,
        tenantContext as never,
        tenantAccess as never
      ),
      prisma,
      tenantContext,
      tenantAccess
    };
  }

  it('hydrates tenant context from token when request context is empty', async () => {
    const { strategy, prisma, tenantContext, tenantAccess } = createStrategy();

    const payload = {
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    };

    await expect(strategy.validate(payload)).resolves.toEqual(payload);
    expect(tenantContext.setTenant).toHaveBeenCalledWith('tenant_001', 'token');
    expect(tenantAccess.assertActiveTenant).toHaveBeenCalledWith('tenant_001');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        tenantId: 'tenant_001'
      },
      select: {
        status: true,
        roles: {
          select: {
            role: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });
  });

  it('throws when header tenant and token tenant are different', async () => {
    const { strategy, tenantContext } = createStrategy('tenant_002');

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED)
    );

    expect(tenantContext.setTenant).not.toHaveBeenCalled();
  });

  it('throws token invalid when token user no longer exists', async () => {
    const { strategy, prisma } = createStrategy();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID)
    );
  });

  it('throws account disabled when token user is disabled', async () => {
    const { strategy, prisma } = createStrategy();
    prisma.user.findFirst.mockResolvedValue({
      status: false,
      roles: [{ role: { status: true } }]
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_ACCOUNT_DISABLED)
    );
  });

  it('throws role disabled when all assigned roles are invalid', async () => {
    const { strategy, prisma } = createStrategy();
    prisma.user.findFirst.mockResolvedValue({
      status: true,
      roles: [{ role: { status: false } }]
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED)
    );
  });
});
