import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `[${req.method}] ${req.originalUrl} ${res.statusCode} ${duration}ms ${String(req.headers['x-request-id'])}`,
      );
    });
    next();
  }
}
