import { Injectable } from '@nestjs/common';
import { Prisma, type Dictionary } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { TenantPrismaScopeService } from '../../../infra/tenancy/tenant-prisma-scope.service';
import {
  createDictionaryId,
  type CreateDictionaryDto,
  type UpdateDictionaryDto
} from './dictionary.dto';
import type { DictionaryTypeNode } from './dictionary.models';

@Injectable()
export class DictionaryTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScope: TenantPrismaScopeService
  ) {}

  findMany() {
    return this.prisma.dictionary.findMany({
      where: this.buildWhere(),
      orderBy: [{ sortCode: 'asc' }, { name: 'asc' }]
    });
  }

  findFirst(where: Prisma.DictionaryWhereInput) {
    return this.prisma.dictionary.findFirst({
      where: this.buildWhere(where)
    });
  }

  create(dto: CreateDictionaryDto) {
    return this.prisma.dictionary.create({
      data: {
        id: createDictionaryId(dto.id),
        parentId: null,
        weight: dto.weight,
        name: dto.name,
        tenantId: this.tenantScope.resolveTenantValue(dto.tenantId),
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        category: dto.category,
        sortCode: dto.sortCode,
        deleteFlag: dto.deleteFlag,
        createTime: dto.createTime ?? null,
        createUser: dto.createUser ?? null,
        updateTime: dto.updateTime ?? null,
        updateUser: dto.updateUser ?? null
      }
    });
  }

  update(id: string, dto: UpdateDictionaryDto) {
    return this.prisma.dictionary.update({
      where: { id },
      data: {
        parentId:
          dto.parentId === undefined || dto.parentId === '0'
            ? null
            : dto.parentId,
        weight: dto.weight,
        name: dto.name,
        tenantId: this.tenantScope.resolveTenantValue(dto.tenantId),
        dictLabel: dto.dictLabel,
        dictValue: dto.dictValue,
        category: dto.category,
        sortCode: dto.sortCode,
        deleteFlag: dto.deleteFlag,
        createTime: dto.createTime,
        createUser: dto.createUser,
        updateTime: dto.updateTime,
        updateUser: dto.updateUser
      }
    });
  }

  toNode(row: Dictionary): DictionaryTypeNode {
    const {
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      parentId: _parentId,
      ...rest
    } = row;

    return {
      ...rest,
      parentId: '0'
    };
  }

  private buildWhere(where: Prisma.DictionaryWhereInput = {}) {
    return this.tenantScope.buildWhere(
      {
        ...where,
        parentId: null
      },
      'tenantId',
      {
        includeGlobal: true
      }
    ) as Prisma.DictionaryWhereInput;
  }
}
