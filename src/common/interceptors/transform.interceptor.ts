import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

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
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipTransform) {
      return next.handle() as unknown as Observable<WrappedResponse<T>>;
    }
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
