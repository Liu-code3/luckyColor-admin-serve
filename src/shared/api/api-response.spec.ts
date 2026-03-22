import { errorResponse, successResponse } from './api-response';

describe('api-response helpers', () => {
  it('builds a success response', () => {
    expect(successResponse({ ok: true }, 'done')).toEqual({
      code: 200,
      msg: 'done',
      data: { ok: true }
    });
  });

  it('builds an error response', () => {
    expect(errorResponse('failed', 400)).toEqual({
      code: 400,
      msg: 'failed',
      data: null
    });
  });
});
