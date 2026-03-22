import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { TenantAuditService } from './tenant-audit.service';
import { CreateTenantDto } from './tenants.dto';
import {
  buildDefaultTenantDepartments,
  buildDefaultTenantDictionaries,
  DEFAULT_TENANT_ROLE_MENU_CODES,
  DEFAULT_TENANT_ROLE_TEMPLATES
} from './tenant-bootstrap.templates';

@Injectable()
export class TenantBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAudit: TenantAuditService,
    private readonly passwordService: PasswordService
  ) {}

  async initializeTenant(dto: CreateTenantDto) {
    await this.ensureTenantCodeAvailable(dto.code);
    const tenantPackage = await this.resolveTenantPackage(dto.packageId);

    return this.prisma.$transaction(async (tx) => {
      const tenantId =
        dto.id?.trim() ||
        `tenant_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          code: dto.code,
          name: dto.name,
          status: dto.status ?? 'ACTIVE',
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          contactName: dto.contactName ?? null,
          contactPhone: dto.contactPhone ?? null,
          contactEmail: dto.contactEmail ?? null,
          packageId: tenantPackage.id,
          remark: dto.remark ?? null
        },
        include: {
          tenantPackage: true
        }
      });

      const departmentTemplates = buildDefaultTenantDepartments(
        tenant.id,
        tenant.code
      );
      const departmentsByKey = new Map<
        string,
        Prisma.DepartmentGetPayload<Record<string, never>>
      >();
      const departments: Prisma.DepartmentGetPayload<Record<string, never>>[] =
        [];

      for (const template of departmentTemplates) {
        const parentDepartment = template.parentKey
          ? departmentsByKey.get(template.parentKey)
          : null;

        if (template.parentKey && !parentDepartment) {
          throw new Error(
            `Missing parent department template: ${template.parentKey}`
          );
        }

        const department = await tx.department.create({
          data: {
            tenantId: template.tenantId,
            parentId: parentDepartment?.id ?? null,
            name: template.name,
            code: template.code,
            leader: template.leader,
            phone: template.phone,
            email: template.email,
            sort: template.sort,
            status: template.status,
            remark: template.remark
          }
        });

        departmentsByKey.set(template.key, department);
        departments.push(department);
      }

      const roles = await Promise.all(
        DEFAULT_TENANT_ROLE_TEMPLATES.map((item) =>
          tx.role.create({
            data: {
              tenantId: tenant.id,
              name: item.name,
              code: item.code,
              sort: item.sort,
              status: item.status,
              dataScope: item.dataScope,
              remark: item.remark
            }
          })
        )
      );

      const tenantAdminRole = roles.find(
        (item) => item.code === 'tenant_admin'
      );
      const tenantMemberRole = roles.find(
        (item) => item.code === 'tenant_member'
      );

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          username: dto.adminUsername?.trim() || 'admin',
          password: await this.passwordService.hash(dto.adminPassword),
          nickname: dto.adminNickname?.trim() || `${tenant.name} Admin`
        }
      });

      if (tenantAdminRole) {
        await tx.userRole.create({
          data: {
            tenantId: tenant.id,
            userId: adminUser.id,
            roleId: tenantAdminRole.id
          }
        });
      }

      const roleMenuRows = roles.flatMap((role) =>
        (DEFAULT_TENANT_ROLE_MENU_CODES[role.code] ?? []).map((menuId) => ({
          tenantId: tenant.id,
          roleId: role.id,
          menuId
        }))
      );

      if (roleMenuRows.length > 0) {
        await tx.roleMenu.createMany({
          data: roleMenuRows
        });
      }

      if (tenantAdminRole) {
        const scopedDepartments = ['headquarters', 'operations']
          .map((key) => departmentsByKey.get(key))
          .filter(
            (
              department
            ): department is Prisma.DepartmentGetPayload<Record<string, never>> =>
              Boolean(department)
          );

        await tx.roleDepartmentScope.createMany({
          data: scopedDepartments.map((department) => ({
            tenantId: tenant.id,
            roleId: tenantAdminRole.id,
            departmentId: department.id
          }))
        });
      }

      const dictionaries = buildDefaultTenantDictionaries(tenant.id);
      await tx.dictionary.createMany({
        data: dictionaries
      });

      await this.tenantAudit.record(
        {
          tenantId: tenant.id,
          action: 'CREATED',
          detail: {
            packageId: tenant.packageId,
            packageCode: tenantPackage.code,
            adminUsername: adminUser.username,
            roleCodes: roles.map((item) => item.code),
            departmentCodes: departments.map((item) => item.code),
            menuIds: Array.from(
              new Set(roleMenuRows.map((item) => item.menuId))
            ).sort((left, right) => left - right),
            dictionaryIds: dictionaries.map((item) => item.id)
          }
        },
        tx
      );

      return {
        tenant,
        adminUser,
        roles,
        departments,
        menuIds: Array.from(
          new Set(roleMenuRows.map((item) => item.menuId))
        ).sort((left, right) => left - right),
        dictionaryIds: dictionaries.map((item) => item.id),
        packageCode: tenantPackage.code,
        adminRoleCode: tenantAdminRole?.code ?? null,
        memberRoleCode: tenantMemberRole?.code ?? null
      };
    });
  }

  private async ensureTenantCodeAvailable(code: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { code }
    });

    if (existing) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async resolveTenantPackage(packageId?: string) {
    if (packageId) {
      const tenantPackage = await this.prisma.tenantPackage.findUnique({
        where: { id: packageId }
      });

      if (!tenantPackage) {
        throw new BusinessException(
          BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
        );
      }

      if (!tenantPackage.status) {
        throw new BusinessException(BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED);
      }

      return tenantPackage;
    }

    const defaultPackage = await this.prisma.tenantPackage.findFirst({
      where: {
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (!defaultPackage) {
      throw new BusinessException(
        BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      );
    }

    return defaultPackage;
  }
}
