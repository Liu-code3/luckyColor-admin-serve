import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import type { RoleDataScope } from '../../system/roles/roles.constants';

type DataScopeRoleRecord = Prisma.UserGetPayload<{
  select: {
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
}

@Injectable()
export class DataScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveProfile(user: JwtPayload): Promise<DataScopeProfile> {
    const currentUser = await this.prisma.user.findFirst({
      where: {
        id: user.sub,
        tenantId: user.tenantId
      },
      select: {
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
        return {
          AND: [where, { id: user.sub }]
        };
      case 'CUSTOM':
      case 'DEPARTMENT':
      case 'DEPARTMENT_AND_CHILDREN':
        // Current user model has no departmentId yet, so department-scoped
        // filtering cannot be applied safely to user queries at this stage.
        throw new BusinessException(
          BUSINESS_ERROR_CODES.DATA_SCOPE_CONFIG_INVALID
        );
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
        departmentIds: []
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'ALL')) {
      return {
        scope: 'ALL',
        departmentIds: []
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
        departmentIds: customDepartmentIds
      };
    }

    if (
      activeRoles.some((role) => role.dataScope === 'DEPARTMENT_AND_CHILDREN')
    ) {
      return {
        scope: 'DEPARTMENT_AND_CHILDREN',
        departmentIds: []
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'DEPARTMENT')) {
      return {
        scope: 'DEPARTMENT',
        departmentIds: []
      };
    }

    if (activeRoles.some((role) => role.dataScope === 'SELF')) {
      return {
        scope: 'SELF',
        departmentIds: []
      };
    }

    throw new BusinessException(BUSINESS_ERROR_CODES.DATA_SCOPE_DENIED);
  }
}
