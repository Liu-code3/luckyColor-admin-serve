import { HttpException } from '@nestjs/common';
import {
  BUSINESS_ERROR_HTTP_STATUS_MAP,
  BUSINESS_ERROR_MESSAGE_MAP,
  type BusinessErrorCode
} from './error-codes';

export class BusinessException extends HttpException {
  readonly code: BusinessErrorCode;

  constructor(code: BusinessErrorCode) {
    super(BUSINESS_ERROR_MESSAGE_MAP[code], BUSINESS_ERROR_HTTP_STATUS_MAP[code]);
    this.code = code;
  }
}
