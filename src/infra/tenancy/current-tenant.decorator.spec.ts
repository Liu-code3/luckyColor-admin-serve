import type { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentTenant } from './current-tenant.decorator';

describe('CurrentTenant', () => {
  class TestController {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test(
      @CurrentTenant() _tenant: unknown,
      @CurrentTenant('tenantId') _tenantId: unknown,
      @CurrentTenant('source') _source: unknown
    ) {}
  }

  function createContext(tenantContext?: {
    tenantId: string | null;
    source: 'header' | 'domain' | 'token' | 'default' | 'none';
  }) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantContext
        })
      })
    } as ExecutionContext;
  }

  function getDecoratorFactory(data?: 'tenantId' | 'source') {
    const metadata =
      Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'test'
      ) ?? {};
    const entry = Object.values(metadata).find(
      (item: unknown): item is { data?: string; factory: Function } =>
        typeof item === 'object' &&
        item !== null &&
        'factory' in item &&
        (item as { data?: string }).data === data
    );

    if (!entry) {
      throw new Error(`CurrentTenant metadata missing for ${data ?? 'context'}`);
    }

    return entry.factory;
  }

  it('returns the full tenant context from request', () => {
    const factory = getDecoratorFactory();

    expect(
      factory(undefined, createContext({
        tenantId: 'tenant_001',
        source: 'header'
      }))
    ).toEqual({
      tenantId: 'tenant_001',
      source: 'header'
    });
  });

  it('returns individual tenant context fields when requested', () => {
    const tenantIdFactory = getDecoratorFactory('tenantId');
    const sourceFactory = getDecoratorFactory('source');

    expect(
      tenantIdFactory('tenantId', createContext({
        tenantId: 'tenant_002',
        source: 'domain'
      }))
    ).toBe('tenant_002');

    expect(
      sourceFactory('source', createContext({
        tenantId: 'tenant_002',
        source: 'domain'
      }))
    ).toBe('domain');
  });

  it('falls back to an empty tenant context when request is not hydrated', () => {
    const factory = getDecoratorFactory();

    expect(factory(undefined, createContext())).toEqual({
      tenantId: null,
      source: 'none'
    });
  });
});
