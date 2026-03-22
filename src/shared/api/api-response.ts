export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export function successResponse<T>(data: T, msg = 'success'): ApiResponse<T> {
  return {
    code: 200,
    msg,
    data
  };
}

export function errorResponse(msg = '操作失败', code = 0): ApiResponse<null> {
  return {
    code,
    msg,
    data: null
  };
}
