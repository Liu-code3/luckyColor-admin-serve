import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { SecurityAuditService } from './security-audit.service';

describe('SecurityAuditService', () => {
  function createService() {
    const prisma = {
      securityAuditLog: {
        create: jest.fn()
      }
    };
    const tenantContext = {
      getTenantId: jest.fn().mockReturnValue('tenant_001')
    };

    return {
      service: new SecurityAuditService(prisma as never, tenantContext as never),
      prisma,
      tenantContext
    };
  }

  it('persists login success audit log with request client info', async () => {
    const { service, prisma } = createService();

    await service.recordLoginSuccess(
      {
        tenantId: 'tenant_001',
        userId: 'user_1',
        username: 'admin'
      },
      {
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'x-forwarded-for': '127.0.0.1, 10.0.0.1'
        }
      }
    );

    expect(prisma.securityAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant_001',
        userId: 'user_1',
        username: 'admin',
        eventType: 'LOGIN',
        outcome: 'SUCCESS',
        requestMethod: 'POST',
        requestPath: '/api/auth/login',
        ipAddress: '127.0.0.1',
        browserVersion: 'Chrome 123.0.0.0',
        terminalSystem: 'Windows'
      })
    });
  });

  it('persists permission denied audit log with reason and detail', async () => {
    const { service, prisma } = createService();

    await service.recordPermissionDenied({
      user: {
        tenantId: 'tenant_001',
        userId: 'user_1',
        username: 'admin'
      },
      reasonCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
      permissions: ['system:user:create'],
      mode: 'ANY',
      boundary: 'PLATFORM_ADMIN',
      request: {
        method: 'POST',
        url: '/api/users',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      }
    });

    expect(prisma.securityAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant_001',
        userId: 'user_1',
        username: 'admin',
        eventType: 'PERMISSION_DENIED',
        outcome: 'DENIED',
        reasonCode: BUSINESS_ERROR_CODES.PERMISSION_DENIED,
        requestMethod: 'POST',
        requestPath: '/api/users',
        detail: {
          permissions: ['system:user:create'],
          mode: 'ANY',
          boundary: 'PLATFORM_ADMIN'
        }
      })
    });
  });

  it('falls back to tenant context when explicit tenant id is absent', async () => {
    const { service, prisma, tenantContext } = createService();
    tenantContext.getTenantId.mockReturnValue('tenant_ctx');

    await service.recordLoginFailure({
      username: 'admin',
      request: {
        method: 'POST',
        url: '/api/auth/login'
      }
    });

    expect(prisma.securityAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant_ctx',
        username: 'admin',
        eventType: 'LOGIN',
        outcome: 'FAILURE'
      })
    });
  });
});
