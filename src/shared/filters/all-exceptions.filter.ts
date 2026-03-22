import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import {
  DEFAULT_ERROR_CODE,
  errorResponse
} from '../api/api-response';

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
    const normalizedStatus = status || DEFAULT_ERROR_CODE;

    this.logger.error(
      `Request failed: ${request.method} ${request.url} -> ${normalizedStatus}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception)
    );

    response.status(normalizedStatus).json(errorResponse(normalizedStatus));
  }
}
