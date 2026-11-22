import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống nội bộ tại Dispatch Service';
    let data: Record<string, any> = { errorCode: 'ERR_INTERNAL_SERVER' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        if (Array.isArray(obj.message)) {
          message = obj.message[0];
          data = { errorCode: obj.errorCode || 'ERR_VALIDATION', details: obj.message };
        } else {
          message = obj.message || message;
          data = obj.data || {
            errorCode: obj.errorCode || `ERR_HTTP_${status}`,
            ...(obj.field ? { field: obj.field } : {}),
          };
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      status,
      message,
      data,
    });
  }
}
