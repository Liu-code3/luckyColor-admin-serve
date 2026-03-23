import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantAuditService } from './tenant-audit.service';
import { TenantBootstrapService } from './tenant-bootstrap.service';

describe('TenantBootstrapService', () => {
  function createPrismaMock() {
    const prisma = {
      tenant: {
        findUnique: jest.fn(),
        create: jest.fn()
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
      roleDepartmentScope: {
        createMany: jest.fn()
      },
      dictionary: {
        createMany: jest.fn()
      },
      tenantAuditLog: {
        create: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
    );

    return prisma;
  }

  it('creates tenant and initializes default resources', async () => {
    const prisma = createPrismaMock();
    const tenantAudit = {
      record: jest.fn().mockResolvedValue({
        id: 'audit-created'
      })
    } satisfies Pick<TenantAuditService, 'record'>;
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-admin-password')
    };
    const service = new TenantBootstrapService(
      prisma as never,
      tenantAudit as never,
      passwordService as never
    );

    prisma.tenant.findUnique.mockResolvedValue(null);
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
      remark: 'created by platform admin',
      createdAt: new Date('2026-03-22T14:30:00.000Z'),
      updatedAt: new Date('2026-03-22T14:30:00.000Z'),
      tenantPackage: {
        id: 'pkg_basic',
        code: 'basic',
        name: '基础版套餐',
        status: true
      }
    });
    prisma.department.create
      .mockResolvedValueOnce({
        id: 201,
        tenantId: 'tenant_acme',
        parentId: null,
        name: 'Headquarters',
        code: 'acme_headquarters',
        sort: 1
      })
      .mockResolvedValueOnce({
        id: 202,
        tenantId: 'tenant_acme',
        parentId: 201,
        name: 'Product',
        code: 'acme_product',
        sort: 10
      })
      .mockResolvedValueOnce({
        id: 203,
        tenantId: 'tenant_acme',
        parentId: 201,
        name: 'Operations',
        code: 'acme_operations',
        sort: 20
      });
    prisma.role.create
      .mockResolvedValueOnce({
        id: 'role-admin',
        code: 'tenant_admin',
        name: 'Tenant Admin'
      })
      .mockResolvedValueOnce({
        id: 'role-member',
        code: 'tenant_member',
        name: 'Tenant Member'
      });
    prisma.user.create.mockResolvedValue({
      id: 'user-admin',
      username: 'admin',
      nickname: 'Acme Admin'
    });
    prisma.userRole.create.mockResolvedValue({ tenantId: 'tenant_acme' });
    prisma.roleMenu.createMany.mockResolvedValue({ count: 15 });
    prisma.roleDepartmentScope.createMany.mockResolvedValue({ count: 2 });
    prisma.dictionary.createMany.mockResolvedValue({ count: 4 });

    const result = await service.initializeTenant({
      id: 'tenant_acme',
      code: 'acme',
      name: 'Acme Studio',
      contactName: 'Alice',
      contactPhone: '13800000003',
      contactEmail: 'alice@acme.local',
      remark: 'created by platform admin',
      adminUsername: 'admin',
      adminPassword: '123456',
      adminNickname: 'Acme Admin'
    });

    expect(prisma.tenant.create).toHaveBeenCalledWith({
      data: {
        id: 'tenant_acme',
        code: 'acme',
        name: 'Acme Studio',
        status: 'ACTIVE',
        expiresAt: null,
        contactName: 'Alice',
        contactPhone: '13800000003',
        contactEmail: 'alice@acme.local',
        packageId: 'pkg_basic',
        remark: 'created by platform admin'
      },
      include: {
        tenantPackage: true
      }
    });
    expect(prisma.department.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        tenantId: 'tenant_acme',
        parentId: null,
        code: 'acme_headquarters'
      })
    });
    expect(prisma.department.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        tenantId: 'tenant_acme',
        parentId: 201,
        code: 'acme_product'
      })
    });
    expect(prisma.department.create).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({
        tenantId: 'tenant_acme',
        parentId: 201,
        code: 'acme_operations'
      })
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_acme',
        userId: 'user-admin',
        roleId: 'role-admin'
      }
    });
    expect(passwordService.hash).toHaveBeenCalledWith('123456');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_acme',
        username: 'admin',
        password: 'hashed-admin-password',
        nickname: 'Acme Admin'
      }
    });
    expect(prisma.roleMenu.createMany).toHaveBeenCalled();
    expect(prisma.roleDepartmentScope.createMany).toHaveBeenCalledWith({
      data: [
        { tenantId: 'tenant_acme', roleId: 'role-admin', departmentId: 201 },
        { tenantId: 'tenant_acme', roleId: 'role-admin', departmentId: 203 }
      ]
    });
    expect(prisma.dictionary.createMany).toHaveBeenCalled();
    expect(tenantAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_acme',
        action: 'CREATED'
      }),
      prisma
    );
    expect(result.menuIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14]);
    expect(result.dictionaryIds).toEqual([
      'tenant_acme_notice_scope_root',
      'tenant_acme_notice_scope_all',
      'tenant_acme_notice_scope_department',
      'tenant_acme_notice_scope_role'
    ]);
  });

  it('throws when tenant code already exists', async () => {
    const prisma = createPrismaMock();
    const service = new TenantBootstrapService(
      prisma as never,
      { record: jest.fn() } as never,
      { hash: jest.fn() } as never
    );
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_existing',
      code: 'acme'
    });

    await expect(
      service.initializeTenant({
        code: 'acme',
        name: 'Acme Studio',
        adminPassword: '123456'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS)
    );
  });

  it('throws when requested tenant package does not exist', async () => {
    const prisma = createPrismaMock();
    const service = new TenantBootstrapService(
      prisma as never,
      { record: jest.fn() } as never,
      { hash: jest.fn() } as never
    );
    prisma.tenant.findUnique.mockResolvedValue(null);
    prisma.tenantPackage.findUnique.mockResolvedValue(null);

    await expect(
      service.initializeTenant({
        code: 'acme',
        name: 'Acme Studio',
        packageId: 'missing_pkg',
        adminPassword: '123456'
      })
    ).rejects.toThrow(
      new BusinessException(BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND)
    );
  });
});
