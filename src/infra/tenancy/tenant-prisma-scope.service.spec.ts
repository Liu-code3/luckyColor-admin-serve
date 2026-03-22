import { TenantPrismaScopeService } from './tenant-prisma-scope.service';

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

    expect(service.buildWhere({ category: 'system_status' }, 'tenantId')).toEqual({
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
      OR: [
        { tenantId: 'tenant_001' },
        { tenantId: null },
        { tenantId: '-1' }
      ]
    });
  });

  it('prefers current tenant id when resolving writable tenant value', () => {
    const { service } = createService('tenant_001');

    expect(service.resolveTenantValue('tenant_other')).toBe('tenant_001');
  });
});
