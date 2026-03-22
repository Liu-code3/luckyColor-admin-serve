import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  function createStrategy(currentTenantId: string | null = null) {
    const configService = {
      get: jest.fn().mockReturnValue('jwt-secret')
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
        tenantContext as never,
        tenantAccess as never
      ),
      tenantContext,
      tenantAccess
    };
  }

  it('hydrates tenant context from token when request context is empty', async () => {
    const { strategy, tenantContext, tenantAccess } = createStrategy();

    const payload = {
      sub: 'user-1',
      tenantId: 'tenant_001',
      username: 'admin'
    };

    await expect(strategy.validate(payload)).resolves.toEqual(payload);
    expect(tenantContext.setTenant).toHaveBeenCalledWith('tenant_001', 'token');
    expect(tenantAccess.assertActiveTenant).toHaveBeenCalledWith('tenant_001');
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
});
