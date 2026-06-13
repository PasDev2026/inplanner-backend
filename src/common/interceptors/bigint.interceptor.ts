import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => this.serialize(data)));
  }

  private serialize(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map((item) => this.serialize(item));
    if (typeof obj === 'object') {
      const source = obj as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          result[key] = this.serialize(source[key]);
        }
      }
      return result;
    }
    return obj;
  }
}
