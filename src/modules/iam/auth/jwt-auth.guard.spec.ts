import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('throws token expired business exception when passport reports expiration', () => {
    const guard = new JwtAuthGuard();

    expect(() =>
      guard.handleRequest(
        null,
        null,
        { name: 'TokenExpiredError' },
        {} as never
      )
    ).toThrowError(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED)
    );
  });

  it('throws token invalid business exception when user is missing', () => {
    const guard = new JwtAuthGuard();

    expect(() =>
      guard.handleRequest(null, null, undefined, {} as never)
    ).toThrowError(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID)
    );
  });

  it('returns current user when authentication succeeds', () => {
    const guard = new JwtAuthGuard();
    const user = { sub: 'user-1', username: 'admin' };

    expect(guard.handleRequest(null, user, undefined, {} as never)).toBe(user);
  });
});
