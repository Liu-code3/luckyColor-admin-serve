import {
  BUSINESS_ERROR_MESSAGE_MAP,
  type BusinessErrorCode
} from './error-codes';

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export const SUCCESS_CODE = 200;
export const DEFAULT_ERROR_CODE = 500;
export const SUCCESS_MESSAGE = 'success';

export const HTTP_ERROR_MESSAGE_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '未登录或登录状态已失效',
  403: '无权访问当前资源',
  404: '请求的资源不存在',
  406: '请求格式不支持',
  410: '请求的资源已被永久删除',
  422: '请求参数校验失败',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂不可用',
  504: '网关超时'
};

export const ERROR_MESSAGE_MAP: Record<number, string> = {
  ...HTTP_ERROR_MESSAGE_MAP,
  ...BUSINESS_ERROR_MESSAGE_MAP
};

export function getErrorMessageByCode(code: number) {
  return ERROR_MESSAGE_MAP[code] || HTTP_ERROR_MESSAGE_MAP[DEFAULT_ERROR_CODE];
}

export function successResponse<T>(
  data: T,
  _msg = SUCCESS_MESSAGE
): ApiResponse<T> {
  return {
    code: SUCCESS_CODE,
    msg: SUCCESS_MESSAGE,
    data
  };
}

export function errorResponse(
  code: number | BusinessErrorCode = DEFAULT_ERROR_CODE
): ApiResponse<null> {
  return {
    code,
    msg: getErrorMessageByCode(code),
    data: null
  };
}
