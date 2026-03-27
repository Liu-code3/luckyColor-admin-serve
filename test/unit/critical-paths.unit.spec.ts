import { TenantPrismaScopeService } from '../../src/infra/tenancy/tenant-prisma-scope.service';
import { AuthLoginService } from '../../src/modules/iam/auth/auth-login.service';
import { AuthService } from '../../src/modules/iam/auth/auth.service';
import { DataScopeService } from '../../src/modules/iam/data-scopes/data-scope.service';
import { RolesService } from '../../src/modules/system/roles/roles.service';
import { TenantBootstrapService } from '../../src/modules/tenant/tenants/tenant-bootstrap.service';

describe('Critical path regression suite', () => {
  describe('Authentication', () => {
    const createTenantScope = (tenantId = 'tenant_001') =>
      new TenantPrismaScopeService({
        getTenantId: jest.fn().mockReturnValue(tenantId)
      } as never);

    function createAuthService() {
      const prisma = {
        user: {
          findFirst: jest.fn(),
          update: jest.fn()
        }
      };
      const jwtService = {
        signAsync: jest.fn().mockResolvedValue('signed-token')
      };
      const appConfig = {
        jwtExpiresIn: '2h'
      };
      const authCaptcha = {
        consumeLoginCaptchaToken: jest.fn().mockResolvedValue(undefined)
      };
      const securityAudit = {
        recordLoginSuccess: jest.fn().mockResolvedValue(undefined),
        recordLoginFailure: jest.fn().mockResolvedValue(undefined),
        recordLogout: jest.fn().mockResolvedValue(undefined)
      };
      const passwordService = {
        isHash: jest.fn().mockReturnValue(true),
        hash: jest.fn().mockResolvedValue('hashed-password'),
        verify: jest.fn().mockResolvedValue(true)
      };
      const authLogin = new AuthLoginService(
        prisma as never,
        createTenantScope(),
        passwordService as never
      );

      return {
        service: new AuthService(
          prisma as never,
          jwtService as never,
          appConfig as never,
          authCaptcha as never,
          authLogin as never,
          securityAudit as never
        ),
        prisma,
        jwtService,
        authCaptcha,
        securityAudit
      };
    }

    it('completes tenant-scoped login and records the success audit trail', async () => {
      const { service, prisma, jwtService, authCaptcha, securityAudit } = createAuthService();
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin',
        password: 'hashed-password',
        nickname: 'System Admin',
        status: true,
        lastLoginAt: null,
        roles: [
          {
            role: {
              id: 'role-1',
              code: 'super_admin',
              status: true,
              menus: [
                {
                  menu: {
                    id: 1,
                    parentId: null,
                    title: 'System',
                    name: 'system',
                    type: 1,
                    path: '/system',
                    menuKey: 'main_system',
                    permissionCode: 'main_system',
                    icon: 'folder',
                    layout: '',
                    isVisible: true,
                    status: true,
                    component: 'layout',
                    redirect: null,
                    meta: null,
                    sort: 1,
                    createdAt: new Date('2026-03-25T00:00:00.000Z'),
                    updatedAt: new Date('2026-03-25T00:00:00.000Z')
                  }
                }
              ]
            }
          }
        ]
      });

      const response = await service.login(
        {
          username: 'admin',
          password: '123456',
          captchaToken: 'captcha-token'
        },
        {
          method: 'POST',
          url: '/api/auth/login',
          ip: '127.0.0.1'
        }
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        tenantId: 'tenant_001',
        username: 'admin'
      });
      expect(authCaptcha.consumeLoginCaptchaToken).toHaveBeenCalledWith('captcha-token');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLoginAt: expect.any(Date) }
      });
      expect(securityAudit.recordLoginSuccess).toHaveBeenCalledWith(
        {
          tenantId: 'tenant_001',
          userId: 'user-1',
          username: 'admin'
        },
        expect.objectContaining({
          method: 'POST',
          url: '/api/auth/login'
        })
      );
      expect(response.data.accessToken).toBe('signed-token');
      expect(response.data.user.roleCodes).toEqual(['super_admin']);
    });
  });

  describe('Tenant bootstrap', () => {
    function createPrismaMock() {
      const prisma = {
        tenant: {
          findUnique: jest.fn(),
          create: jest.fn()
        },
        menu: {
          findMany: jest.fn()
        },
        tenantPackage: {
          findUnique: jest.fn(),
          findFirst: jest.fn()
        },
        department: {
          create: jest.fn()
        },
        role: {
          create: jest.fn()
        },
        user: {
          create: jest.fn()
        },
        userRole: {
          create: jest.fn()
        },
        roleMenu: {
          createMany: jest.fn()
        },
        rolePermission: {
          createMany: jest.fn()
        },
        roleDepartmentScope: {
          createMany: jest.fn()
        },
        dictionary: {
          createMany: jest.fn()
        },
        $transaction: jest.fn()
      };

      prisma.$transaction.mockImplementation(
        async (callback: (tx: typeof prisma) => Promise<unknown>) =>
          callback(prisma)
      );

      return prisma;
    }

    it('provisions the default tenant skeleton for a newly created tenant', async () => {
      const prisma = createPrismaMock();
      const tenantAudit = {
        record: jest.fn().mockResolvedValue(undefined)
      };
      const passwordService = {
        hash: jest.fn().mockResolvedValue('hashed-admin-password')
      };
      const service = new TenantBootstrapService(
        prisma as never,
        tenantAudit as never,
        passwordService as never
      );

      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.menu.findMany.mockResolvedValue([
        { id: 1, menuKey: 'main_analysis' },
        { id: 3, menuKey: 'main_analysis_technology' },
        { id: 4, menuKey: 'main_system' },
        { id: 5, menuKey: 'main_system_users' },
        { id: 6, menuKey: 'main_system_department' },
        { id: 7, menuKey: 'main_system_menu' },
        { id: 8, menuKey: 'main_system_role' },
        { id: 11, menuKey: 'icomponent_dict' },
        { id: 13, menuKey: 'main_system_config' },
        { id: 14, menuKey: 'main_system_notice' }
      ]);
      prisma.tenantPackage.findFirst.mockResolvedValue({
        id: 'pkg_basic',
        code: 'basic',
        status: true
      });
      prisma.tenant.create.mockResolvedValue({
        id: 'tenant_acme',
        code: 'acme',
        name: 'Acme Studio',
        status: 'ACTIVE',
        expiresAt: null,
        contactName: 'Alice',
        contactPhone: '13800000003',
        contactEmail: 'alice@acme.local',
        remark: null,
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
        updatedAt: new Date('2026-03-25T00:00:00.000Z'),
        tenantPackage: {
          id: 'pkg_basic',
          code: 'basic',
          name: 'Basic',
          status: true
        }
      });
      prisma.department.create
        .mockResolvedValueOnce({ id: 201, tenantId: 'tenant_acme', parentId: null, name: 'HQ', code: 'acme_hq', sort: 1 })
        .mockResolvedValueOnce({ id: 202, tenantId: 'tenant_acme', parentId: 201, name: 'Product', code: 'acme_product', sort: 10 })
        .mockResolvedValueOnce({ id: 203, tenantId: 'tenant_acme', parentId: 201, name: 'Operations', code: 'acme_operations', sort: 20 });
      prisma.role.create
        .mockResolvedValueOnce({ id: 'role-admin', code: 'tenant_admin', name: 'Tenant Admin' })
        .mockResolvedValueOnce({ id: 'role-member', code: 'tenant_member', name: 'Tenant Member' });
      prisma.user.create.mockResolvedValue({
        id: 'user-admin',
        username: 'admin',
        nickname: 'Acme Admin'
      });
      prisma.userRole.create.mockResolvedValue({ tenantId: 'tenant_acme' });
      prisma.roleMenu.createMany.mockResolvedValue({ count: 8 });
      prisma.rolePermission.createMany.mockResolvedValue({ count: 8 });
      prisma.roleDepartmentScope.createMany.mockResolvedValue({ count: 2 });
      prisma.dictionary.createMany.mockResolvedValue({ count: 4 });

      const result = await service.initializeTenant({
        id: 'tenant_acme',
        code: 'acme',
        name: 'Acme Studio',
        adminUsername: 'admin',
        adminPassword: '123456',
        adminNickname: 'Acme Admin'
      });

      expect(prisma.tenant.create).toHaveBeenCalled();
      expect(prisma.role.create).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant_acme',
            username: 'admin',
            password: 'hashed-admin-password'
          })
        })
      );
      expect(prisma.roleMenu.createMany).toHaveBeenCalled();
      expect(prisma.rolePermission.createMany).toHaveBeenCalled();
      expect(result.tenant.id).toBe('tenant_acme');
      expect(result.roles.map((item) => item.code)).toEqual([
        'tenant_admin',
        'tenant_member'
      ]);
    });
  });

  describe('Role authorization', () => {
    const createTenantScope = (tenantId = 'tenant_001') =>
      new TenantPrismaScopeService({
        getTenantId: jest.fn().mockReturnValue(tenantId)
      } as never);

    function createPrismaMock() {
      const prisma = {
        role: {
          findFirst: jest.fn()
        },
        menu: {
          findMany: jest.fn()
        },
        roleMenu: {
          deleteMany: jest.fn(),
          createMany: jest.fn()
        },
        rolePermission: {
          deleteMany: jest.fn(),
          createMany: jest.fn()
        },
        $transaction: jest.fn()
      };

      prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
      );

      return prisma;
    }

    it('rebuilds role menu bindings and synchronized permission points together', async () => {
      const prisma = createPrismaMock();
      const service = new RolesService(prisma as never, createTenantScope());
      prisma.role.findFirst.mockResolvedValue({
        id: 'role-1',
        tenantId: 'tenant_001',
        name: 'Tenant Admin',
        code: 'tenant_admin',
        sort: 1,
        status: true,
        dataScope: 'ALL',
        remark: null,
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
        updatedAt: new Date('2026-03-25T00:00:00.000Z')
      });
      prisma.menu.findMany.mockResolvedValue([
        {
          id: 1,
          permissionCode: 'main_system',
          menuKey: 'main_system',
          title: 'System',
          parentId: null,
          name: 'system',
          type: 1,
          path: '/system',
          icon: '',
          layout: '',
          isVisible: true,
          status: true,
          component: 'layout',
          redirect: null,
          meta: null,
          sort: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 11,
          permissionCode: 'system:notice:list',
          menuKey: 'system:notice:list',
          title: 'Notice',
          parentId: 1,
          name: 'notice',
          type: 2,
          path: '/system/notices',
          icon: '',
          layout: '',
          isVisible: true,
          status: true,
          component: 'notice',
          redirect: null,
          meta: null,
          sort: 11,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      prisma.roleMenu.deleteMany.mockResolvedValue({ count: 2 });
      prisma.roleMenu.createMany.mockResolvedValue({ count: 2 });

      const response = await service.assignMenus('role-1', {
        menuIds: [1, 11]
      });

      expect(prisma.roleMenu.createMany).toHaveBeenCalledWith({
        data: [
          { roleId: 'role-1', menuId: 1, tenantId: 'tenant_001' },
          { roleId: 'role-1', menuId: 11, tenantId: 'tenant_001' }
        ]
      });
      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: {
          AND: [{ roleId: 'role-1' }, { tenantId: 'tenant_001' }]
        }
      });
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: [
          {
            roleId: 'role-1',
            permissionCode: 'main_system',
            tenantId: 'tenant_001'
          },
          {
            roleId: 'role-1',
            permissionCode: 'system:notice:list',
            tenantId: 'tenant_001'
          }
        ]
      });
      expect(response.data.menuIds).toEqual([1, 11]);
    });
  });

  describe('Data permission', () => {
    function createService() {
      const prisma = {
        user: {
          findFirst: jest.fn()
        }
      };
      const departmentsService = {
        findDescendantDepartmentIdsByTenant: jest.fn()
      };
      const tenantActor = {
        isPlatformAdmin: jest.fn(() => false)
      };

      return {
        service: new DataScopeService(
          prisma as never,
          departmentsService as never,
          tenantActor as never
        ),
        prisma
      };
    }

    it('merges custom department data scope with incoming user filters', async () => {
      const { service, prisma } = createService();
      prisma.user.findFirst.mockResolvedValue({
        departmentId: 120,
        roles: [
          {
            role: {
              code: 'tenant_admin',
              status: true,
              dataScope: 'CUSTOM',
              dataScopeDepartments: [{ departmentId: 100 }, { departmentId: 120 }]
            }
          }
        ]
      });

      const where = await service.buildUserWhere(
        {
          sub: 'user-1',
          tenantId: 'tenant_001',
          username: 'admin'
        },
        {
          username: { contains: 'alice' },
          status: true
        }
      );

      expect(where).toEqual({
        AND: [
          {
            username: { contains: 'alice' },
            status: true
          },
          {
            departmentId: { in: [100, 120] }
          }
        ]
      });
    });
  });
});
