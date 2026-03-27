import { Reflector } from '@nestjs/core';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantActorService } from '../../tenant/tenants/tenant-actor.service';
import { PermissionGuard } from './permission-guard';

describe('PermissionGuard', () => {
  function createExecutionContext(user?: {
    sub: string;
    tenantId: string;
    username: string;
  }) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user
        })
      })
    } as never;
  }

  function createGuard(requirement?: {
    permissions: string[];
    mode: 'ANY' | 'ALL';
    boundary?: 'ANY' | 'PLATFORM_ADMIN';
    denialCode?: number;
  }) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requirement)
    };
    const prisma = {
      user: {
        findFirst: jest.fn()
      }
    };
    const tenantActor = {
      isPlatformAdmin: jest.fn((roleCodes: string[]) =>
        roleCodes.includes('super_admin')
      )
    };
    const securityAudit = {
      recordPermissionDenied: jest.fn().mockResolvedValue(undefined)
    };

    return {
      guard: new PermissionGuard(
        reflector as unknown as Reflector,
        prisma as never,
        tenantActor as unknown as TenantActorService,
        securityAudit as never
      ),
      reflector,
      prisma,
      tenantActor,
      securityAudit
    };
  }

  it('allows access when route does not declare permissions', async () => {
    const { guard, prisma } = createGuard();

    await expect(guard.canActivate(createExecutionContext())).resolves.toBe(
      true
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('throws token invalid when current request has no authenticated user', async () => {
    const { guard } = createGuard({
      permissions: ['main_system_users'],
      mode: 'ANY'
    });

    await expect(guard.canActivate(createExecutionContext())).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID)
    );
  });

  it('allows access for super admin role', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['main_system_tenant'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'super_admin',
            status: true,
            menus: []
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-1',
          tenantId: 'tenant_001',
          username: 'admin'
        })
      )
    ).resolves.toBe(true);
  });

  it('blocks tenant admin from platform-only routes even when menu permission matches', async () => {
    const { guard, prisma, securityAudit } = createGuard({
      permissions: ['main_system_tenant'],
      mode: 'ANY',
      boundary: 'PLATFORM_ADMIN',
      denialCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            menus: [{ menu: { menuKey: 'main_system_tenant', status: true } }]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-6',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED)
    );
    expect(securityAudit.recordPermissionDenied).toHaveBeenCalledWith({
      user: {
        tenantId: 'tenant_001',
        userId: 'user-6',
        username: 'tenant-admin'
      },
      reasonCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED,
      permissions: ['main_system_tenant'],
      mode: 'ANY',
      boundary: 'PLATFORM_ADMIN',
      request: expect.objectContaining({
        user: {
          sub: 'user-6',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        }
      })
    });
  });

  it('allows access when any configured permission matches', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['main_system_users', 'main_system_role'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            menus: [{ menu: { menuKey: 'main_system_role', status: true } }]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-2',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).resolves.toBe(true);
  });

  it('allows access when permission comes from direct permission points', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['tenant:package:assign'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            permissions: [{ permissionCode: 'tenant:package:assign' }],
            menus: []
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-7',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).resolves.toBe(true);
  });

  it('denies access when required permissions are missing', async () => {
    const { guard, prisma, securityAudit } = createGuard({
      permissions: ['main_system_tenant_package'],
      mode: 'ANY',
      denialCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            menus: [{ menu: { menuKey: 'main_system_config', status: true } }]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-3',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED)
    );
    expect(securityAudit.recordPermissionDenied).toHaveBeenCalledWith({
      user: {
        tenantId: 'tenant_001',
        userId: 'user-3',
        username: 'tenant-admin'
      },
      reasonCode: BUSINESS_ERROR_CODES.MENU_PERMISSION_DENIED,
      permissions: ['main_system_tenant_package'],
      mode: 'ANY',
      boundary: undefined,
      request: expect.objectContaining({
        user: {
          sub: 'user-3',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        }
      })
    });
  });

  it('returns role disabled when all assigned roles are invalid', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['main_system_menu'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: false,
            menus: [{ menu: { menuKey: 'main_system_menu', status: true } }]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-4',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.ROLE_DISABLED)
    );
  });

  it('denies access when permission only comes from disabled menus', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['main_system_menu'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            menus: [{ menu: { menuKey: 'main_system_menu', status: false } }]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-5',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.PERMISSION_DENIED)
    );
  });

  it('does not grant disabled menu permissions even when mirrored in role permissions', async () => {
    const { guard, prisma } = createGuard({
      permissions: ['main_system_menu'],
      mode: 'ANY'
    });
    prisma.user.findFirst.mockResolvedValue({
      roles: [
        {
          role: {
            code: 'tenant_admin',
            status: true,
            permissions: [{ permissionCode: 'main_system_menu' }],
            menus: [
              {
                menu: {
                  menuKey: 'main_system_menu',
                  permissionCode: 'main_system_menu',
                  status: false
                }
              }
            ]
          }
        }
      ]
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          sub: 'user-7',
          tenantId: 'tenant_001',
          username: 'tenant-admin'
        })
      )
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.PERMISSION_DENIED)
    );
  });
});
