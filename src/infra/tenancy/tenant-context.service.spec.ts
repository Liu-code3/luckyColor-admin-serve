import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  it('returns a normalized empty snapshot when no request context exists', () => {
    const service = new TenantContextService();

    expect(service.getSnapshot()).toEqual({
      tenantId: null,
      source: 'none'
    });
  });

  it('exposes tenant id and source inside the request lifecycle', async () => {
    const service = new TenantContextService();

    await service.run(
      {
        tenantId: 'tenant_001',
        source: 'header'
      },
      async () => {
        expect(service.getTenantId()).toBe('tenant_001');
        expect(service.getSource()).toBe('header');
        expect(service.getSnapshot()).toEqual({
          tenantId: 'tenant_001',
          source: 'header'
        });
      }
    );
  });

  it('throws when requiring tenant context without a tenant id', () => {
    const service = new TenantContextService();

    expect(() => service.requireTenant()).toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED)
    );
  });
});
