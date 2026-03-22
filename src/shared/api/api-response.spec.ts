import { errorResponse, successResponse } from './api-response';
import { BUSINESS_ERROR_CODES } from './error-codes';

describe('api-response helpers', () => {
  it('builds a success response', () => {
    expect(successResponse({ ok: true }, 'done')).toEqual({
      code: 200,
      msg: 'success',
      data: { ok: true }
    });
  });

  it('builds an http error response', () => {
    expect(errorResponse(400)).toEqual({
      code: 400,
      msg: '请求参数错误',
      data: null
    });
  });

  it('builds a business error response', () => {
    expect(errorResponse(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED)).toEqual({
      code: BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED,
      msg: '用户名或密码错误',
      data: null
    });
  });
});
