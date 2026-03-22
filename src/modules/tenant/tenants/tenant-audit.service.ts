import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { type TenantAuditAction } from './tenant-audit.constants';

type TenantAuditTx = Pick<Prisma.TransactionClient, 'tenantAuditLog'>;

export interface TenantAuditRecordInput {
  tenantId: string;
  action: TenantAuditAction;
  operatorTenantId?: string | null;
  operatorUserId?: string | null;
  detail?: Prisma.InputJsonValue | null;
}

@Injectable()
export class TenantAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    input: TenantAuditRecordInput,
    tx: TenantAuditTx = this.prisma
  ) {
    return tx.tenantAuditLog.create({
      data: {
        tenantId: input.tenantId,
        action: input.action,
        operatorTenantId: input.operatorTenantId ?? null,
        operatorUserId: input.operatorUserId ?? null,
        detail: input.detail ?? Prisma.JsonNull
      }
    });
  }

  async recordMany(
    inputs: TenantAuditRecordInput[],
    tx: TenantAuditTx = this.prisma
  ) {
    for (const input of inputs) {
      await this.record(input, tx);
    }
  }
}
