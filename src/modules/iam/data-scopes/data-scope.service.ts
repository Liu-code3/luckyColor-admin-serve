import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { DepartmentsService } from '../../system/departments/departments.service';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import type { RoleDataScope } from '../../system/roles/roles.constants';

type DataScopeRoleRecord = Prisma.UserGetPayload<{
  select: {
    departmentId: true;
    roles: {
      select: {
        role: {
          select: {
            code: true;
            status: true;
            dataScope: true;
            dataScopeDepartments: {
              select: {
                departmentId: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export interface DataScopeProfile {
  scope: RoleDataScope;
  departmentIds: number[];
  userDepartmentId: number | null;
}

@Injectable()
export class DataScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departmentsService: DepartmentsService
  ) {}

  async resolveProfile(user: JwtPayload): Promise<DataScopeProfile> {
    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: user.sub,
        tenantId: user.tenantId
      },
      select: {
        departmentId: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                status: true,
                dataScope: true,
                dataScopeDepartments: {
                  select: {
                    departmentId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!currentUser) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return this.resolveProfileFromRecord(currentUser);
  }

  async buildUserWhere(
    user: JwtPayload,
    where: Prisma.UserWhereInput = {}
  ): Promise<Prisma.UserWhereInput> {
    const profile = await this.resolveProfile(user);

    switch (profile.scope) {
      case 'ALL':
        return where;
      case 'SELF':
        return this.combineWhere(where, { id: user.sub });
      case 'DEPARTMENT':
        if (!profile.userDepartmentId) {
          throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
        }

        return this.combineWhere(where, {
          departmentId: profile.userDepartmentId
        });
      case 'DEPARTMENT_AND_CHILDREN': {
        if (!profile.userDepartmentId) {
          throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
        }

        const departmentIds = await this.collectDepartmentIds(
          user.tenantId,
          profile.userDepartmentId
        );

        return this.combineWhere(where, {
          departmentId: { in: departmentIds }
        });
      }
      case 'CUSTOM':
        if (!profile.departmentIds.length) {
          throw new BusinessException(
            BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
          );
        }

        return this.combineWhere(where, {
          departmentId: { in: profile.departmentIds }
        });
      default:
        throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
    }
  }

  private resolveProfileFromRecord(
    user: DataScopeRoleRecord
  ): DataScopeProfile {
    const activeRoles = user.roles
      .map((item) => item.role)
      .filter((role) => role.status);

    if (!activeRoles.length) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
    }

    if (activeRoles.some((role) => role.code === 'super_admin')) {
      return {
        scope: 'ALL',
        departmentIds: [],
        userDepartmentId: user.departmentId
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'ALL')) {
      return {
        scope: 'ALL',
        departmentIds: [],
        userDepartmentId: user.departmentId
      };
    }

    const customDepartmentIds = Array.from(
      new Set(
        activeRoles
          .filter((role) => role.dataScope === 'CUSTOM')
          .flatMap((role) =>
            role.dataScopeDepartments.map((item) => item.departmentId)
          )
      )
    ).sort((left, right) => left - right);

    if (customDepartmentIds.length > 0) {
      return {
        scope: 'CUSTOM',
        departmentIds: customDepartmentIds,
        userDepartmentId: user.departmentId
      };
    }

    if (
      activeRoles.some((role) => role.dataScope === 'DEPARTMENT_AND_CHILDREN')
    ) {
      return {
        scope: 'DEPARTMENT_AND_CHILDREN',
        departmentIds: [],
        userDepartmentId: user.departmentId
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'DEPARTMENT')) {
      return {
        scope: 'DEPARTMENT',
        departmentIds: [],
        userDepartmentId: user.departmentId
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'SELF')) {
      return {
        scope: 'SELF',
        departmentIds: [],
        userDepartmentId: user.departmentId
      };
    }

    throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
  }

  private async collectDepartmentIds(
    tenantId: string,
    rootDepartmentId: number
  ) {
    return this.departmentsService.findDescendantDepartmentIdsByTenant(
      tenantId,
      rootDepartmentId
    );
  }

  private combineWhere(
    where: Prisma.UserWhereInput | undefined,
    constraint: Prisma.UserWhereInput
  ) {
    if (!where || Object.keys(where).length === 0) {
      return constraint;
    }

    return {
      AND: [where, constraint]
    };
  }
}
