import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let msg = '服务端异常';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        msg = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse &&
        'message' in exceptionResponse
      ) {
        const message = (exceptionResponse as { message?: string | string[] })
          .message;
        msg = Array.isArray(message) ? message.join(', ') : message || msg;
      }
    }

    response.status(status).json({
      code: status,
      msg,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
