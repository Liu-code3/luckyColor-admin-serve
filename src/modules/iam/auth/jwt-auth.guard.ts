import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: { name?: string } | undefined,
    _context: ExecutionContext
  ) {
    if (info?.name === 'TokenExpiredError') {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }

    if (err instanceof BusinessException) {
      throw err;
    }

    if (err || !user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    return user;
  }
}
