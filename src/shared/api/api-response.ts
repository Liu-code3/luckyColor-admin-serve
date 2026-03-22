export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export const SUCCESS_CODE = 200;
export const DEFAULT_ERROR_CODE = 500;
export const SUCCESS_MESSAGE = 'success';

export const ERROR_MESSAGE_MAP: Record<number, string> = {
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。'
};

export function getErrorMessageByCode(code: number) {
  return ERROR_MESSAGE_MAP[code] || ERROR_MESSAGE_MAP[DEFAULT_ERROR_CODE];
}

export function successResponse<T>(data: T, _msg = SUCCESS_MESSAGE): ApiResponse<T> {
  return {
    code: SUCCESS_CODE,
    msg: SUCCESS_MESSAGE,
    data
  };
}

export function errorResponse(
  codeOrMsg: number | string = DEFAULT_ERROR_CODE,
  fallbackCode = DEFAULT_ERROR_CODE
): ApiResponse<null> {
  const code =
    typeof codeOrMsg === 'number'
      ? codeOrMsg
      : fallbackCode;

  return {
    code,
    msg: getErrorMessageByCode(code),
    data: null
  };
}
