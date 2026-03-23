import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessException } from '../api/business.exception';
import { BUSINESS_ERROR_CODES } from '../api/error-codes';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost(url = '/api/test', method = 'GET') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method, url };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request
    })
  } as ArgumentsHost;

  return { host, response, status, json };
}

describe('AllExceptionsFilter', () => {
  it('returns business error payload', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = createHost();

    filter.catch(
      new BusinessException(BUSINESS_ERROR_CODES.USER_NOT_FOUND),
      host
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: BUSINESS_ERROR_CODES.USER_NOT_FOUND,
      msg: '用户不存在',
      data: null
    });
  });

  it('maps validation exception to request params invalid code', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = createHost();
    const exception = new HttpException(
      { message: ['name should not be empty'] },
      HttpStatus.UNPROCESSABLE_ENTITY
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(json).toHaveBeenCalledWith({
      code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID,
      msg: '请求参数校验失败',
      data: null
    });
  });

  it('returns http error payload for unknown system exception', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = createHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      msg: '服务器内部错误',
      data: null
    });
  });

  it('skips logging extension scheme 404 requests', () => {
    const filter = new AllExceptionsFilter();
    const loggerErrorSpy = jest
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
    const { host, status, json } = createHost(
      '/chrome-extension://oglffgiaiekgeicdgkdlnlkhliajdlja/injectScript.js'
    );

    filter.catch(
      new HttpException('Cannot GET extension resource', HttpStatus.NOT_FOUND),
      host
    );

    expect(loggerErrorSpy).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: HttpStatus.NOT_FOUND,
      msg: '请求的资源不存在',
      data: null
    });
  });

  it('skips logging dashboard heartbeat auth expiry noise', () => {
    const filter = new AllExceptionsFilter();
    const loggerErrorSpy = jest
      .spyOn(filter['logger'], 'error')
      .mockImplementation(() => undefined);
    const { host, status, json } = createHost(
      '/api/dashboard/track-visit',
      'POST'
    );

    filter.catch(
      new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED),
      host
    );

    expect(loggerErrorSpy).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith({
      code: BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      msg: '登录已过期，请重新登录',
      data: null
    });
  });
});
