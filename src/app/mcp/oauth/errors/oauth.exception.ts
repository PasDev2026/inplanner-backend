import { HttpException } from '@nestjs/common';

/**
 * Error con el formato JSON exigido por OAuth 2.1 (RFC 6749):
 * `{ error, error_description }`.
 *
 * Se lanza desde los endpoints JSON (`/oauth/register`, `/oauth/token`) y lo
 * formatea `OAuthExceptionFilter`.
 */
export class OAuthException extends HttpException {
  constructor(
    readonly error: string,
    status: number,
    readonly description?: string,
  ) {
    super(error, status);
  }
}
