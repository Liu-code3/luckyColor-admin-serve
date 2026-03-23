import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { errorResponse } from '../api/api-response';
import { BusinessException } from '../api/business.exception';
import { BUSINESS_ERROR_CODES } from '../api/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!this.shouldIgnoreRequestLog(request, status, exception)) {
      this.logger.error(
        `Request failed: ${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      );
    }

    if (exception instanceof BusinessException) {
      response.status(status).json(errorResponse(exception.code));
      return;
    }

    if (
      exception instanceof HttpException &&
      status === HttpStatus.UNPROCESSABLE_ENTITY
    ) {
      response
        .status(status)
        .json(errorResponse(BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID));
      return;
    }

    if (
      exception instanceof HttpException &&
      status === HttpStatus.UNAUTHORIZED
    ) {
      response
        .status(status)
        .json(errorResponse(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID));
      return;
    }

    if (exception instanceof HttpException && status === HttpStatus.FORBIDDEN) {
      response
        .status(status)
        .json(errorResponse(BUSINESS_ERROR_CODES.PERMISSION_DENIED));
      return;
    }

    response.status(status).json(errorResponse(status));
  }

  private shouldIgnoreRequestLog(
    request: { method?: string; url?: string },
    status: number,
    exception: unknown
  ) {
    if (
      status === HttpStatus.NOT_FOUND &&
      /^\/(?:chrome|moz|safari)-extension:\/\//.test(request.url ?? '')
    ) {
      return true;
    }

    if (
      request.method === 'POST' &&
      request.url === '/api/dashboard/track-visit' &&
      status === HttpStatus.UNAUTHORIZED &&
      exception instanceof BusinessException &&
      (exception.code === BUSINESS_ERROR_CODES.AUTH_TOKEN_EXPIRED ||
        exception.code === BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID)
    ) {
      return true;
    }

    return false;
  }
}
