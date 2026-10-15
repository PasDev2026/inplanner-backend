import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { OAuthException } from './oauth.exception';

/** Formatea `OAuthException` como el error JSON de OAuth (RFC 6749). */
@Catch(OAuthException)
export class OAuthExceptionFilter implements ExceptionFilter {
  catch(exception: OAuthException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.getStatus()).json({
      error: exception.error,
      ...(exception.description
        ? { error_description: exception.description }
        : {}),
    });
  }
}
