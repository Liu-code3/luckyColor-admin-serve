import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantActorService } from './tenant-actor.service';

describe('TenantActorService', () => {
  function createService() {
    const prisma = {
      user: {
        findFirst: jest.fn()
      }
    };

    return {
      service: new TenantActorService(prisma as never),
      prisma
    };
  }

  it('recognizes platform admin from super admin role code', () => {
    const { service } = createService();

    expect(service.resolveBoundary(['super_admin'])).toBe('PLATFORM_ADMIN');
    expect(service.isPlatformAdmin(['super_admin'])).toBe(true);
    expect(service.isTenantAdmin(['super_admin', 'tenant_admin'])).toBe(false);
  });

  it('recognizes tenant admin when only tenant admin role is active', () => {
    const { service } = createService();

    expect(service.resolveBoundary(['tenant_admin'])).toBe('TENANT_ADMIN');
    expect(service.isPlatformAdmin(['tenant_admin'])).toBe(false);
    expect(service.isTenantAdmin(['tenant_admin'])).toBe(true);
  });

  it('resolves tenant user when no admin role is present', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      status: true,
      roles: [
        {
          role: {
            code: 'tenant_member',
            status: true
          }
        }
      ]
    });

    await expect(
      service.resolveProfile({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'member'
      })
    ).resolves.toEqual({
      boundary: 'TENANT_USER',
      roleCodes: ['tenant_member'],
      isPlatformAdmin: false,
      isTenantAdmin: false
    });
  });

  it('blocks tenant admins from platform-only access', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue({
      status: true,
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true
          }
        }
      ]
    });

    await expect(
      service.assertPlatformAdmin(
        {
          sub: 'user-2',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        },
        BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED)
    );
  });
});
