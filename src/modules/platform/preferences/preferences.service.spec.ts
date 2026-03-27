import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  function createService() {
    const prisma = {
      userPreference: {
        findUnique: jest.fn(),
        upsert: jest.fn()
      }
    };
    const tenantScope = {
      requireTenantId: jest.fn().mockReturnValue('tenant_001'),
      buildRequiredData: jest.fn((data) => ({
        ...data,
        tenantId: 'tenant_001'
      }))
    };

    return {
      service: new PreferencesService(prisma as never, tenantScope as never),
      prisma,
      tenantScope
    };
  }

  const currentUser = {
    sub: 'user_1',
    tenantId: 'tenant_001',
    username: 'admin'
  };

  function createPreference(overrides: Record<string, unknown> = {}) {
    return {
      userId: 'user_1',
      layout: 'mix',
      theme: 'ocean',
      darkMode: true,
      fullscreen: false,
      tabPreferences: {
        enabled: true,
        persist: true,
        showIcon: false,
        draggable: true
      },
      createdAt: new Date('2026-03-25T08:00:00.000Z'),
      updatedAt: new Date('2026-03-25T08:30:00.000Z'),
      ...overrides
    };
  }

  it('returns defaults when the current user has not saved preferences', async () => {
    const { service, prisma, tenantScope } = createService();
    prisma.userPreference.findUnique.mockResolvedValue(null);

    const response = await service.detail(currentUser);

    expect(tenantScope.requireTenantId).toHaveBeenCalled();
    expect(prisma.userPreference.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_userId: {
          tenantId: 'tenant_001',
          userId: 'user_1'
        }
      }
    });
    expect(response.data).toEqual({
      userId: 'user_1',
      layout: 'side',
      theme: 'default',
      darkMode: false,
      fullscreen: false,
      tabPreferences: {
        enabled: true,
        persist: true,
        showIcon: true,
        draggable: true
      },
      createdAt: null,
      updatedAt: null
    });
  });

  it('reads persisted preferences for the current user', async () => {
    const { service, prisma } = createService();
    prisma.userPreference.findUnique.mockResolvedValue(createPreference());

    const response = await service.detail(currentUser);

    expect(response.data.layout).toBe('mix');
    expect(response.data.theme).toBe('ocean');
    expect(response.data.darkMode).toBe(true);
    expect(response.data.tabPreferences.showIcon).toBe(false);
  });

  it('merges partial tab preference updates and upserts by tenant and user', async () => {
    const { service, prisma, tenantScope } = createService();
    prisma.userPreference.findUnique.mockResolvedValue(createPreference());
    prisma.userPreference.upsert.mockResolvedValue(
      createPreference({
        fullscreen: true,
        tabPreferences: {
          enabled: true,
          persist: false,
          showIcon: false,
          draggable: true
        },
        updatedAt: new Date('2026-03-25T09:00:00.000Z')
      })
    );

    const response = await service.save(currentUser, {
      fullscreen: true,
      tabPreferences: {
        persist: false
      }
    });

    expect(tenantScope.buildRequiredData).toHaveBeenCalledWith({
      userId: 'user_1',
      layout: 'mix',
      theme: 'ocean',
      darkMode: true,
      fullscreen: true,
      tabPreferences: {
        enabled: true,
        persist: false,
        showIcon: false,
        draggable: true
      }
    });
    expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
      where: {
        tenantId_userId: {
          tenantId: 'tenant_001',
          userId: 'user_1'
        }
      },
      create: {
        tenantId: 'tenant_001',
        userId: 'user_1',
        layout: 'mix',
        theme: 'ocean',
        darkMode: true,
        fullscreen: true,
        tabPreferences: {
          enabled: true,
          persist: false,
          showIcon: false,
          draggable: true
        }
      },
      update: {
        layout: 'mix',
        theme: 'ocean',
        darkMode: true,
        fullscreen: true,
        tabPreferences: {
          enabled: true,
          persist: false,
          showIcon: false,
          draggable: true
        }
      }
    });
    expect(response.data.fullscreen).toBe(true);
    expect(response.data.tabPreferences.persist).toBe(false);
  });
});
