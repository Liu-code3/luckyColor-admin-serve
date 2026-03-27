import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { PasswordService } from '../../../infra/security/password.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import {
  BUSINESS_ERROR_CODES,
  BUSINESS_ERROR_MESSAGE_MAP
} from '../../../shared/api/error-codes';
import { resolveSortOrder } from '../../../shared/api/list-query.util';
import { rethrowUniqueConstraintAsBusinessException } from '../../../shared/api/prisma-exception.util';
import type { JwtPayload } from '../../iam/auth/jwt-payload.interface';
import { DataScopeService } from '../../iam/data-scopes/data-scope.service';
import {
  AssignUserRolesDto,
  CreateUserDto,
  ResetUserPasswordDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserListQueryDto
} from './users.dto';

type UserWithDepartment = Prisma.UserGetPayload<{
  include: {
    department: true;
  };
}>;

type UserImportRow = {
  username: string;
  password: string;
  nickname?: string;
  phone?: string | null;
  email?: string | null;
  avatar?: string | null;
  status?: boolean;
  departmentCode?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService,
    private readonly passwordService: PasswordService,
    private readonly dataScopeService: DataScopeService
  ) {}

  async list(user: JwtPayload, query: UserListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const where = await this.buildScopedListWhere(user, query);
    const orderBy = this.buildListOrderBy(query);

    const [total, records] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          department: true
        },
        orderBy,
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toUserResponse(item))
    });
  }

  async exportCsv(user: JwtPayload, query: UserListQueryDto) {
    const where = await this.buildScopedListWhere(user, query);
    const orderBy = this.buildListOrderBy(query);
    const records = await this.prisma.user.findMany({
      where,
      include: {
        department: true
      },
      orderBy
    });

    const rows = [
      [
        'id',
        'tenantId',
        'username',
        'nickname',
        'phone',
        'email',
        'avatar',
        'status',
        'departmentId',
        'departmentCode',
        'departmentName',
        'lastLoginAt',
        'createdAt',
        'updatedAt'
      ],
      ...records.map((item) => [
        item.id,
        item.tenantId,
        item.username,
        item.nickname ?? '',
        item.phone ?? '',
        item.email ?? '',
        item.avatar ?? '',
        String(item.status),
        item.departmentId === null ? '' : String(item.departmentId),
        item.department?.code ?? '',
        item.department?.name ?? '',
        item.lastLoginAt?.toISOString() ?? '',
        item.createdAt.toISOString(),
        item.updatedAt.toISOString()
      ])
    ];
    const content = `${rows.map((row) => row.map((item) => this.escapeCsvValue(item)).join(',')).join('\n')}\n`;
    const dateStamp = new Date().toISOString().slice(0, 10);

    return {
      filename: `users-${dateStamp}.csv`,
      content: Buffer.from(content, 'utf8')
    };
  }

  async importCsv(file: { originalname: string; buffer: Buffer } | undefined) {
    if (!file?.buffer?.length) {
      throw new BusinessException(BUSINESS_ERROR_CODES.FILE_UPLOAD_FAILED);
    }

    const rows = this.parseCsv(file.buffer.toString('utf8'));

    if (rows.length <= 1) {
      throw new BusinessException(BUSINESS_ERROR_CODES.FILE_UPLOAD_FAILED);
    }

    const headers = rows[0].map((item) => item.trim().toLowerCase());
    const requiredHeaders = ['username', 'password'];

    if (requiredHeaders.some((item) => !headers.includes(item))) {
      throw new BusinessException(BUSINESS_ERROR_CODES.FILE_UPLOAD_FAILED);
    }

    const dataRows = rows
      .slice(1)
      .map((row, index) => ({
        row,
        rowNumber: index + 2
      }))
      .filter(({ row }) => row.some((item) => item.trim().length > 0));

    const failureList: Array<{
      rowNumber: number;
      username: string | null;
      reason: string;
    }> = [];
    let successCount = 0;

    for (const item of dataRows) {
      const record = this.mapImportRow(headers, item.row);
      const username = record.username?.trim() || null;

      try {
        const dto = await this.toCreateUserDto(record);
        await this.create(dto);
        successCount += 1;
      } catch (error) {
        failureList.push({
          rowNumber: item.rowNumber,
          username,
          reason: this.resolveImportErrorReason(error)
        });
      }
    }

    return successResponse({
      fileName: file.originalname,
      totalCount: dataRows.length,
      successCount,
      failureCount: failureList.length,
      failureList
    });
  }

  async detail(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id }),
      include: {
        department: true
      }
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(this.toUserResponse(user));
  }

  async create(dto: CreateUserDto) {
    const username = dto.username.trim();
    const nickname = this.normalizeOptionalString(dto.nickname) ?? username;
    const phone = this.normalizeOptionalString(dto.phone);
    const email = this.normalizeOptionalString(dto.email);
    const avatar = this.normalizeOptionalString(dto.avatar);

    await this.ensureUsernameAvailable(username);
    await this.ensurePhoneAvailable(phone);
    await this.ensureEmailAvailable(email);
    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    try {
      const user = await this.prisma.user.create({
        data: this.tenantScope.buildRequiredData({
          departmentId: dto.departmentId ?? null,
          username,
          password: await this.passwordService.hash(dto.password),
          nickname,
          phone: phone ?? null,
          email: email ?? null,
          avatar: avatar ?? null,
          status: dto.status ?? true
        }),
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);

    const username = dto.username?.trim();
    const nickname = this.normalizeOptionalString(dto.nickname);
    const phone = this.normalizeOptionalString(dto.phone);
    const email = this.normalizeOptionalString(dto.email);
    const avatar = this.normalizeOptionalString(dto.avatar);

    await this.ensureDepartmentBelongsToTenant(dto.departmentId);

    if (username) {
      await this.ensureUsernameAvailable(username, id);
    }

    if (phone !== undefined) {
      await this.ensurePhoneAvailable(phone, id);
    }

    if (email !== undefined) {
      await this.ensureEmailAvailable(email, id);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          username,
          password: dto.password
            ? await this.passwordService.hash(dto.password)
            : undefined,
          nickname,
          phone,
          email,
          avatar,
          status: dto.status,
          departmentId: dto.departmentId
        },
        include: {
          department: true
        }
      });

      return successResponse(this.toUserResponse(user));
    } catch (error) {
      rethrowUniqueConstraintAsBusinessException(error);
    }
  }

  async remove(id: string) {
    await this.ensureUserExists(id);
    await this.prisma.user.delete({ where: { id } });
    return successResponse(true);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    await this.ensureUserExists(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status
      },
      include: {
        department: true
      }
    });

    return successResponse(this.toUserResponse(user));
  }

  async resetPassword(id: string, dto: ResetUserPasswordDto) {
    await this.ensureUserExists(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: await this.passwordService.hash(dto.password)
      }
    });

    return successResponse(true);
  }

  async roles(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id }),
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }

    return successResponse(
      this.toUserRoleAssignmentResponse(
        user,
        user.roles
          .map((item) => item.role)
          .sort((left, right) => left.sort - right.sort)
      )
    );
  }

  async assignRoles(id: string, dto: AssignUserRolesDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: this.buildUserWhere({ id })
      });
      if (!user) {
        throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
      }

      const roles =
        dto.roleIds.length > 0
          ? await tx.role.findMany({
              where: this.buildRoleWhere({
                id: { in: dto.roleIds }
              }),
              orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
            })
          : [];

      if (roles.length !== dto.roleIds.length) {
        throw new BusinessException(BUSINESS_ERROR_CODES.ROLE_NOT_FOUND);
      }

      if (roles.some((role) => !role.status)) {
        throw new BusinessException(BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED);
      }

      await tx.userRole.deleteMany({
        where: this.buildUserRoleWhere({ userId: id })
      });

      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) =>
            this.tenantScope.buildRequiredData({
              userId: id,
              roleId
            })
          )
        });
      }

      return successResponse(this.toUserRoleAssignmentResponse(user, roles));
    });
  }

  private buildUserWhere(where: Prisma.UserWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.UserWhereInput;
  }

  private buildRoleWhere(where: Prisma.RoleWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.RoleWhereInput;
  }

  private buildDepartmentWhere(where: Prisma.DepartmentWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.DepartmentWhereInput;
  }

  private buildUserRoleWhere(where: Prisma.UserRoleWhereInput = {}) {
    return this.tenantScope.buildRequiredWhere(
      where,
      'tenantId'
    ) as Prisma.UserRoleWhereInput;
  }

  private buildUserListWhere(query: UserListQueryDto, keyword?: string) {
    const filters: Prisma.UserWhereInput[] = [];

    if (keyword) {
      filters.push({
        OR: [
          { username: { contains: keyword } },
          { nickname: { contains: keyword } },
          { phone: { contains: keyword } },
          { email: { contains: keyword } }
        ]
      });
    }

    if (query.status !== undefined) {
      filters.push({
        status: query.status
      });
    }

    if (query.departmentId !== undefined) {
      filters.push({
        departmentId: query.departmentId
      });
    }

    const createdAt = this.buildCreatedAtWhere(
      query.createdAtStart,
      query.createdAtEnd
    );
    if (createdAt) {
      filters.push({ createdAt });
    }

    if (!filters.length) {
      return undefined;
    }

    if (filters.length === 1) {
      return filters[0];
    }

    return {
      AND: filters
    };
  }

  private buildCreatedAtWhere(start?: string, end?: string) {
    if (!start && !end) {
      return undefined;
    }

    const where: Prisma.DateTimeFilter = {};

    if (start) {
      where.gte = new Date(start);
    }

    if (end) {
      where.lte = new Date(end);
    }

    return where;
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({ id })
    });
    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  }

  private async ensureUsernameAvailable(username: string, excludeId?: string) {
    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        username,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async ensurePhoneAvailable(phone?: string | null, excludeId?: string) {
    if (phone === undefined || phone === null) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        phone,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async ensureEmailAvailable(email?: string | null, excludeId?: string) {
    if (email === undefined || email === null) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: this.buildUserWhere({
        email,
        id: excludeId ? { not: excludeId } : undefined
      })
    });

    if (user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private async ensureDepartmentBelongsToTenant(departmentId?: number | null) {
    if (departmentId === undefined) {
      return null;
    }

    if (departmentId === null) {
      return null;
    }

    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentWhere({ id: departmentId })
    });

    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return department;
  }

  private buildListOrderBy(query: UserListQueryDto): Prisma.UserOrderByWithRelationInput[] {
    const sortOrder = resolveSortOrder(query.sortOrder);

    switch (query.sortBy) {
      case 'username':
        return [{ username: sortOrder }, { createdAt: 'desc' }];
      case 'nickname':
        return [{ nickname: sortOrder }, { createdAt: 'desc' }];
      case 'status':
        return [{ status: sortOrder }, { createdAt: 'desc' }];
      case 'updatedAt':
        return [{ updatedAt: sortOrder }, { createdAt: 'desc' }];
      case 'createdAt':
      default:
        return [{ createdAt: sortOrder }];
    }
  }

  private async buildScopedListWhere(
    user: JwtPayload,
    query: UserListQueryDto
  ) {
    const keyword = query.keyword?.trim();
    const scopedWhere = await this.dataScopeService.buildUserWhere(
      user,
      this.buildUserListWhere(query, keyword)
    );

    return this.buildUserWhere(scopedWhere);
  }

  private async resolveDepartmentIdByCode(departmentCode?: string | null) {
    if (departmentCode === undefined) {
      return undefined;
    }

    if (departmentCode === null) {
      return null;
    }

    const normalizedCode = departmentCode.trim();

    if (!normalizedCode) {
      return null;
    }

    const department = await this.prisma.department.findFirst({
      where: this.buildDepartmentWhere({
        code: normalizedCode
      })
    });

    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return department.id;
  }

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private parseCsv(content: string) {
    const normalizedContent = content.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let index = 0; index < normalizedContent.length; index += 1) {
      const char = normalizedContent[index];
      const nextChar = normalizedContent[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          index += 1;
        }

        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        continue;
      }

      currentField += char;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  }

  private mapImportRow(headers: string[], row: string[]): UserImportRow {
    const record = headers.reduce<Record<string, string>>((result, header, index) => {
      result[header] = row[index]?.trim() ?? '';
      return result;
    }, {});

    return {
      username: record.username ?? '',
      password: record.password ?? '',
      nickname: record.nickname || undefined,
      phone: record.phone ? record.phone : null,
      email: record.email ? record.email : null,
      avatar: record.avatar ? record.avatar : null,
      status: this.parseImportStatus(record.status),
      departmentCode: record.departmentcode ? record.departmentcode : null
    };
  }

  private parseImportStatus(value?: string) {
    if (!value?.trim()) {
      return true;
    }

    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'enabled'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'disabled'].includes(normalized)) {
      return false;
    }

    throw new BusinessException(BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID);
  }

  private async toCreateUserDto(record: UserImportRow) {
    const username = record.username.trim();
    const password = record.password.trim();

    if (!username || !password) {
      throw new BusinessException(BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID);
    }

    return {
      username,
      password,
      nickname: record.nickname,
      phone: record.phone,
      email: record.email,
      avatar: record.avatar,
      status: record.status ?? true,
      departmentId: await this.resolveDepartmentIdByCode(record.departmentCode)
    };
  }

  private resolveImportErrorReason(error: unknown) {
    if (error instanceof BusinessException) {
      return BUSINESS_ERROR_MESSAGE_MAP[error.code] ?? '导入失败';
    }

    return '导入失败';
  }

  private escapeCsvValue(value: string) {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  private toUserResponse(user: UserWithDepartment) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code
          }
        : null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private toAssignedRoleResponse(
    role: Prisma.RoleGetPayload<Record<string, never>>
  ) {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      code: role.code,
      sort: role.sort,
      status: role.status
    };
  }

  private toUserRoleAssignmentResponse(
    user: {
      id: string;
      tenantId: string;
      username: string;
      nickname: string | null;
    },
    roles: Prisma.RoleGetPayload<Record<string, never>>[]
  ) {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
      nickname: user.nickname,
      roleIds: roles.map((item) => item.id),
      roles: roles.map((item) => this.toAssignedRoleResponse(item))
    };
  }
}
