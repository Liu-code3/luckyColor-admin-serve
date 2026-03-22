import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessException } from '../api/business.exception';
import { BUSINESS_ERROR_CODES } from '../api/error-codes';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { method: 'GET', url: '/api/test' };

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
});
