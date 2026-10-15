import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuthConfigService } from '../oauth-config.service';

/** Valida un access token OAuth (JWT HS256 con `aud` = recurso del MCP). */
@Injectable()
export class VerifyAccessTokenUseCase {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: OAuthConfigService,
  ) {}

  async execute(token: string, resource: string): Promise<boolean> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          secret: this.config.signingSecret,
          algorithms: ['HS256'],
          audience: resource,
        },
      );
      return payload['typ'] === 'access';
    } catch {
      return false;
    }
  }
}
