import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  CreateDepartmentDto,
  DepartmentListQueryDto,
  UpdateDepartmentDto
} from './departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: DepartmentListQueryDto) {
    const current = query.page || 1;
    const size = query.size || 10;
    const keyword = query.keyword?.trim();
    const where = keyword
      ? {
          OR: [{ name: { contains: keyword } }, { code: { contains: keyword } }]
        }
      : {};

    const [total, records] = await this.prisma.$transaction([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        skip: (current - 1) * size,
        take: size
      })
    ]);

    return successResponse({
      total,
      current,
      size,
      records: records.map((item) => this.toDepartmentResponse(item))
    });
  }

  async tree() {
    const records = await this.prisma.department.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    return successResponse(
      this.buildTree(records.map((item) => this.toDepartmentResponse(item)))
    );
  }

  async detail(id: number) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    return successResponse(this.toDepartmentResponse(department));
  }

  async create(dto: CreateDepartmentDto) {
    await this.ensureDepartmentCodeAvailable(dto.code);

    const nextId = dto.id ?? (await this.getNextId());
    const department = await this.prisma.department.create({
      data: {
        id: nextId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        code: dto.code,
        leader: dto.leader ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        sort: dto.sort ?? nextId,
        status: dto.status ?? true,
        remark: dto.remark ?? null
      }
    });

    return successResponse(this.toDepartmentResponse(department));
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.ensureDepartmentExists(id);

    if (dto.code) {
      await this.ensureDepartmentCodeAvailable(dto.code, id);
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        parentId: dto.parentId,
        name: dto.name,
        code: dto.code,
        leader: dto.leader,
        phone: dto.phone,
        email: dto.email,
        sort: dto.sort,
        status: dto.status,
        remark: dto.remark
      }
    });

    return successResponse(this.toDepartmentResponse(department));
  }

  async remove(id: number) {
    const records = await this.prisma.department.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });
    const target = records.find((item) => item.id === id);
    if (!target) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }

    const ids = this.collectDepartmentIds(id, records);
    await this.prisma.department.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return successResponse(true);
  }

  private async getNextId() {
    const result = await this.prisma.department.aggregate({
      _max: { id: true }
    });
    return (result._max.id ?? 0) + 1;
  }

  private async ensureDepartmentExists(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id }
    });
    if (!department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DEPARTMENT_NOT_FOUND);
    }
    return department;
  }

  private async ensureDepartmentCodeAvailable(code: string, excludeId?: number) {
    const department = await this.prisma.department.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined
      }
    });

    if (department) {
      throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
    }
  }

  private collectDepartmentIds(
    rootId: number,
    rows: Array<{ id: number; parentId: number | null }>
  ) {
    const ids = [rootId];
    const walk = (parentId: number) => {
      rows
        .filter((item) => item.parentId === parentId)
        .forEach((item) => {
          ids.push(item.id);
          walk(item.id);
        });
    };
    walk(rootId);
    return ids;
  }

  private buildTree(
    items: Array<ReturnType<DepartmentsService['toDepartmentResponse']>>
  ) {
    const map = new Map<
      number,
      ReturnType<DepartmentsService['toDepartmentResponse']> & {
        children?: Array<ReturnType<DepartmentsService['toDepartmentResponse']>>;
      }
    >();
    const roots: Array<
      ReturnType<DepartmentsService['toDepartmentResponse']> & {
        children?: Array<ReturnType<DepartmentsService['toDepartmentResponse']>>;
      }
    > = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    map.forEach((item) => {
      if (!item.pid) {
        roots.push(item);
        return;
      }

      const parent = map.get(item.pid);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots.map((item) => {
      if (!item.children?.length) {
        const { children: _children, ...rest } = item;
        return rest;
      }
      return item;
    });
  }

  private toDepartmentResponse(department: {
    id: number;
    parentId: number | null;
    name: string;
    code: string;
    leader: string | null;
    phone: string | null;
    email: string | null;
    sort: number;
    status: boolean;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      pid: department.parentId ?? 0,
      id: department.id,
      name: department.name,
      code: department.code,
      leader: department.leader,
      phone: department.phone,
      email: department.email,
      sort: department.sort,
      status: department.status,
      remark: department.remark,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };
  }
}
