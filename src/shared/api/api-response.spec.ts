import { errorResponse, successResponse } from './api-response';

describe('api-response helpers', () => {
  it('builds a success response', () => {
    expect(successResponse({ ok: true }, 'done')).toEqual({
      code: 200,
      msg: 'success',
      data: { ok: true }
    });
  });

  it('builds an error response', () => {
    expect(errorResponse('failed', 400)).toEqual({
      code: 400,
      msg: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
      data: null
    });
  });
});
