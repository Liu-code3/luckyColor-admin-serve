import { Prisma } from '../../generated/prisma';
import { BusinessException } from './business.exception';
import { BUSINESS_ERROR_CODES } from './error-codes';

function normalizeTargets(target: unknown) {
  if (Array.isArray(target)) {
    return target.map((item) => String(item));
  }

  if (typeof target === 'string') {
    return [target];
  }

  return [];
}

export function isUniqueConstraintError(
  error: unknown,
  expectedTargets?: string[]
) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2002') {
    return false;
  }

  if (!expectedTargets?.length) {
    return true;
  }

  const actualTargets = normalizeTargets(error.meta?.target);
  return expectedTargets.every((target) => actualTargets.includes(target));
}

export function rethrowUniqueConstraintAsBusinessException(
  error: unknown,
  expectedTargets?: string[]
): never {
  if (isUniqueConstraintError(error, expectedTargets)) {
    throw new BusinessException(BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS);
  }

  throw error;
}
