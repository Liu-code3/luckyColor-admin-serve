import { TenantPrismaScopeService } from './tenant-prisma-scope.service';
import { BusinessException } from '../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../shared/api/error-codes';

describe('TenantPrismaScopeService', () => {
  function createService(tenantId: string | null) {
    const tenantContext = {
      getTenantId: jest.fn().mockReturnValue(tenantId)
    };

    return {
      service: new TenantPrismaScopeService(tenantContext as never),
      tenantContext
    };
  }

  it('returns original where clause when tenant context is missing', () => {
    const { service } = createService(null);

    expect(service.buildWhere({ id: 'dict-1' }, 'tenantId')).toEqual({
      id: 'dict-1'
    });
  });

  it('adds tenant constraint when tenant context exists', () => {
    const { service } = createService('tenant_001');

    expect(
      service.buildWhere({ category: 'system_status' }, 'tenantId')
    ).toEqual({
      AND: [
        { category: 'system_status' },
        {
          tenantId: 'tenant_001'
        }
      ]
    });
  });

  it('supports tenant queries with global fallback values', () => {
    const { service } = createService('tenant_001');

    expect(
      service.buildWhere(undefined, 'tenantId', {
        includeGlobal: true
      })
    ).toEqual({
      OR: [{ tenantId: 'tenant_001' }, { tenantId: null }, { tenantId: '-1' }]
    });
  });

  it('prefers current tenant id when resolving writable tenant value', () => {
    const { service } = createService('tenant_001');

    expect(service.resolveTenantValue('tenant_other')).toBe('tenant_001');
  });

  it('throws when required tenant context is missing', () => {
    const { service } = createService(null);

    expect(() => service.requireTenantId()).toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED)
    );
  });

  it('builds strict tenant where clause for required tenant tables', () => {
    const { service } = createService('tenant_001');

    expect(service.buildRequiredWhere({ id: 'user-1' }, 'tenantId')).toEqual({
      AND: [{ id: 'user-1' }, { tenantId: 'tenant_001' }]
    });
  });
});
