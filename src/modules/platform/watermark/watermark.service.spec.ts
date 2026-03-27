import { WatermarkService } from './watermark.service';

describe('WatermarkService', () => {
  function createService() {
    const prisma = {
      tenant: {
        findUnique: jest.fn()
      },
      systemConfig: {
        findFirst: jest.fn()
      },
      watermarkConfig: {
        findFirst: jest.fn()
      }
    };
    const tenantScope = {
      requireTenantId: jest.fn().mockReturnValue('tenant_001')
    };

    return {
      service: new WatermarkService(prisma as never, tenantScope as never),
      prisma,
      tenantScope
    };
  }

  const currentUser = {
    sub: 'user_1',
    tenantId: 'tenant_001',
    username: 'admin'
  };

  it('returns built-in defaults when no watermark config exists', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      tenantPackage: {
        featureFlags: {
          watermark: true
        }
      }
    });
    prisma.systemConfig.findFirst.mockResolvedValue({
      configValue: 'true'
    });
    prisma.watermarkConfig.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const response = await service.current(currentUser);

    expect(response.data).toEqual({
      enabled: true,
      content: 'LuckyColor Admin',
      opacity: 0.15,
      color: '#1f2937',
      fontSize: 16,
      rotation: -22,
      source: 'DEFAULT'
    });
  });

  it('applies system watermark config when tenant override is absent', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      tenantPackage: {
        featureFlags: {
          watermark: true
        }
      }
    });
    prisma.systemConfig.findFirst.mockResolvedValue({
      configValue: 'true'
    });
    prisma.watermarkConfig.findFirst
      .mockResolvedValueOnce({
        tenantId: null,
        content: 'System Watermark',
        opacity: 0.1,
        color: '#475569',
        fontSize: 14,
        rotation: -18,
        status: true
      })
      .mockResolvedValueOnce(null);

    const response = await service.current(currentUser);

    expect(response.data).toEqual({
      enabled: true,
      content: 'System Watermark',
      opacity: 0.1,
      color: '#475569',
      fontSize: 14,
      rotation: -18,
      source: 'SYSTEM'
    });
  });

  it('lets tenant watermark config override system values', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      tenantPackage: {
        featureFlags: {
          watermark: true
        }
      }
    });
    prisma.systemConfig.findFirst.mockResolvedValue({
      configValue: 'true'
    });
    prisma.watermarkConfig.findFirst
      .mockResolvedValueOnce({
        tenantId: null,
        content: 'System Watermark',
        opacity: 0.1,
        color: '#475569',
        fontSize: 14,
        rotation: -18,
        status: true
      })
      .mockResolvedValueOnce({
        tenantId: 'tenant_001',
        content: null,
        opacity: 0.2,
        color: '#0f172a',
        fontSize: null,
        rotation: null,
        status: false
      });

    const response = await service.current(currentUser);

    expect(response.data).toEqual({
      enabled: false,
      content: 'System Watermark',
      opacity: 0.2,
      color: '#0f172a',
      fontSize: 14,
      rotation: -18,
      source: 'TENANT'
    });
  });

  it('forces watermark off when tenant package disables the feature', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      tenantPackage: {
        featureFlags: {
          watermark: false
        }
      }
    });
    prisma.systemConfig.findFirst.mockResolvedValue({
      configValue: 'true'
    });
    prisma.watermarkConfig.findFirst
      .mockResolvedValueOnce({
        tenantId: null,
        content: 'System Watermark',
        opacity: 0.1,
        color: '#475569',
        fontSize: 14,
        rotation: -18,
        status: true
      })
      .mockResolvedValueOnce({
        tenantId: 'tenant_001',
        content: 'Tenant Watermark',
        opacity: 0.2,
        color: '#0f172a',
        fontSize: 18,
        rotation: -12,
        status: true
      });

    const response = await service.current(currentUser);

    expect(response.data.enabled).toBe(false);
    expect(response.data.source).toBe('TENANT_PACKAGE');
    expect(response.data.content).toBe('Tenant Watermark');
  });

  it('forces watermark off when the system switch is disabled', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      tenantPackage: {
        featureFlags: {
          watermark: true
        }
      }
    });
    prisma.systemConfig.findFirst.mockResolvedValue({
      configValue: 'false'
    });
    prisma.watermarkConfig.findFirst
      .mockResolvedValueOnce({
        tenantId: null,
        content: 'System Watermark',
        opacity: 0.1,
        color: '#475569',
        fontSize: 14,
        rotation: -18,
        status: true
      })
      .mockResolvedValueOnce(null);

    const response = await service.current(currentUser);

    expect(response.data.enabled).toBe(false);
    expect(response.data.source).toBe('SYSTEM_SWITCH');
    expect(response.data.content).toBe('System Watermark');
  });
});
