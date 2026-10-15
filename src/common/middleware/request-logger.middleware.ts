import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/** Nombres de query params cuyo valor NUNCA debe quedar en claro en los logs. */
const SENSITIVE_QUERY_PARAMS = ['token', 'access_token', 'api_key'];

const SENSITIVE_QUERY_PATTERN = new RegExp(
  `([?&](?:${SENSITIVE_QUERY_PARAMS.join('|')})=)[^&]*`,
  'gi',
);

/** Reemplaza el valor de los query params sensibles por `***`. */
export function redactSensitiveQuery(url: string): string {
  return url.replace(SENSITIVE_QUERY_PATTERN, '$1***');
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const safeUrl = redactSensitiveQuery(req.originalUrl);
      this.logger.log(
        `[${req.method}] ${safeUrl} ${res.statusCode} ${duration}ms ${String(req.headers['x-request-id'])}`,
      );
    });
    next();
  }
}
