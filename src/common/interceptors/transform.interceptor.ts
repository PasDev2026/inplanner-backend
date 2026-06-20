import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WrappedResponse<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  WrappedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        const isPaginated =
          data !== null &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data;
        if (isPaginated) {
          const paginated = data as unknown as { data: T; meta: unknown };
          return {
            success: true,
            data: paginated.data,
            meta: paginated.meta,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
