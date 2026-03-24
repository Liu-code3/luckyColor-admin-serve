import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantAccessService } from './tenant-access.service';

describe('TenantAccessService', () => {
  function createService() {
    const prisma = {
      tenant: {
        findUnique: jest.fn()
      }
    };

    return {
      service: new TenantAccessService(prisma as never),
      prisma
    };
  }

  it('throws when tenant does not exist', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue(null);

    await expect(service.assertActiveTenant('tenant_001')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_NOT_FOUND)
    );
  });

  it('throws when tenant is disabled', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      status: 'DISABLED',
      expiresAt: null
    });

    await expect(service.assertActiveTenant('tenant_001')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_DISABLED)
    );
  });

  it('throws when tenant is expired', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      status: 'ACTIVE',
      expiresAt: new Date('2020-01-01T00:00:00.000Z')
    });

    await expect(service.assertActiveTenant('tenant_001')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_EXPIRED)
    );
  });

  it('throws when tenant is frozen', async () => {
    const { service, prisma } = createService();
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_001',
      status: 'FROZEN',
      expiresAt: null
    });

    await expect(service.assertActiveTenant('tenant_001')).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_FROZEN)
    );
  });

  it('returns tenant when tenant is active and not expired', async () => {
    const { service, prisma } = createService();
    const tenant = {
      id: 'tenant_001',
      status: 'ACTIVE',
      expiresAt: new Date('2099-01-01T00:00:00.000Z')
    };
    prisma.tenant.findUnique.mockResolvedValue(tenant);

    await expect(service.assertActiveTenant('tenant_001')).resolves.toEqual(
      tenant
    );
  });
});
