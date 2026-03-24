import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';
import { TenantContextMiddleware } from './tenant-context.middleware';

describe('TenantContextMiddleware', () => {
  function createMiddleware(overrides?: {
    defaultTenantId?: string | null;
    tenantDomainSuffix?: string | null;
  }) {
    const tenantContext = {
      run: jest.fn().mockImplementation((_store, callback: () => unknown) =>
        callback()
      )
    };
    const tenantAccess = {
      findByCode: jest.fn(),
      assertActiveTenant: jest.fn().mockResolvedValue({
        id: 'tenant_001',
        status: 'ACTIVE'
      })
    };
    const appConfig = {
      tenantHeader: 'x-tenant-id',
      tenantDomainSuffix: overrides?.tenantDomainSuffix ?? null,
      defaultTenantId: overrides?.defaultTenantId ?? null
    };

    return {
      middleware: new TenantContextMiddleware(
        tenantContext as never,
        tenantAccess as never,
        appConfig as never
      ),
      tenantContext,
      tenantAccess
    };
  }

  function createRequest(headers: Record<string, string> = {}, hostname?: string) {
    return {
      hostname,
      header(name: string) {
        return headers[name];
      }
    };
  }

  it('prefers request header over domain and default tenant', async () => {
    const { middleware, tenantContext, tenantAccess } = createMiddleware({
      defaultTenantId: 'tenant_default',
      tenantDomainSuffix: 'example.com'
    });
    const next = jest.fn();

    await middleware.use(
      createRequest(
        {
          'x-tenant-id': 'tenant_header',
          host: 'acme.example.com'
        },
        'acme.example.com'
      ),
      {},
      next
    );

    expect(tenantAccess.findByCode).not.toHaveBeenCalled();
    expect(tenantContext.run).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_header',
        source: 'header'
      },
      expect.any(Function)
    );
    expect(tenantAccess.assertActiveTenant).toHaveBeenCalledWith(
      'tenant_header'
    );
  });

  it('resolves tenant from domain suffix when header is absent', async () => {
    const { middleware, tenantContext, tenantAccess } = createMiddleware({
      tenantDomainSuffix: 'example.com'
    });
    tenantAccess.findByCode.mockResolvedValue({
      id: 'tenant_acme',
      code: 'acme'
    });
    const next = jest.fn();

    await middleware.use(
      createRequest(
        {
          host: 'acme.example.com'
        },
        'acme.example.com'
      ),
      {},
      next
    );

    expect(tenantAccess.findByCode).toHaveBeenCalledWith('acme');
    expect(tenantContext.run).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_acme',
        source: 'domain'
      },
      expect.any(Function)
    );
    expect(tenantAccess.assertActiveTenant).toHaveBeenCalledWith('tenant_acme');
  });

  it('falls back to default tenant when neither header nor domain matches', async () => {
    const { middleware, tenantContext, tenantAccess } = createMiddleware({
      defaultTenantId: 'tenant_default',
      tenantDomainSuffix: 'example.com'
    });
    const next = jest.fn();

    await middleware.use(
      createRequest(
        {
          host: 'example.com'
        },
        'example.com'
      ),
      {},
      next
    );

    expect(tenantAccess.findByCode).not.toHaveBeenCalled();
    expect(tenantContext.run).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_default',
        source: 'default'
      },
      expect.any(Function)
    );
    expect(tenantAccess.assertActiveTenant).toHaveBeenCalledWith(
      'tenant_default'
    );
  });

  it('rejects matched domain when tenant code does not exist', async () => {
    const { middleware, tenantAccess } = createMiddleware({
      tenantDomainSuffix: 'example.com'
    });
    tenantAccess.findByCode.mockResolvedValue(null);

    await expect(
      middleware.use(
        createRequest(
          {
            host: 'ghost.example.com'
          },
          'ghost.example.com'
        ),
        {},
        jest.fn()
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND)
    );

    expect(tenantAccess.assertActiveTenant).not.toHaveBeenCalled();
  });
});
