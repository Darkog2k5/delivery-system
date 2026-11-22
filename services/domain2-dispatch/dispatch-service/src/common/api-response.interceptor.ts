import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((payload: any) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'status' in payload &&
          'message' in payload &&
          'data' in payload
        ) {
          return payload;
        }
        const status = response?.statusCode || 200;
        const message =
          payload && typeof payload === 'object' && typeof payload._message === 'string'
            ? payload._message
            : 'Success';
        if (payload && typeof payload === 'object' && '_message' in payload) {
          const { _message, ...rest } = payload;
          return {
            status,
            message,
            data: rest,
          };
        }
        return {
          status,
          message,
          data: payload,
        };
      }),
    );
  }
}
