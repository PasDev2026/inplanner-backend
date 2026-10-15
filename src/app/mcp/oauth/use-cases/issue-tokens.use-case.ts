import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../constants/oauth.constants';
import type { TokenResponse } from '../interfaces/oauth.interface';
import { hashToken } from '../lib/crypto.util';
import { OAuthConfigService } from '../oauth-config.service';
import { McpOAuthRepository } from '../persistence/mcp-oauth.repository';

export interface IssueTokensParams {
  client_id: string;
  scope: string;
  resource: string;
}

/** Emite un access token (JWT HS256) + refresh token (persistido hasheado). */
@Injectable()
export class IssueTokensUseCase {
  private readonly logger = new Logger('McpOAuth');

  constructor(
    private readonly jwt: JwtService,
    private readonly repository: McpOAuthRepository,
    private readonly config: OAuthConfigService,
  ) {}

  async execute(params: IssueTokensParams): Promise<TokenResponse> {
    const accessToken = await this.jwt.signAsync(
      { scope: params.scope, client_id: params.client_id, typ: 'access' },
      {
        secret: this.config.signingSecret,
        algorithm: 'HS256',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        audience: params.resource,
        subject: params.client_id,
      },
    );

    const refreshToken = randomBytes(32).toString('base64url');
    await this.repository.createRefreshToken({
      token_hash: hashToken(refreshToken),
      client_id: params.client_id,
      scope: params.scope,
      resource: params.resource,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });
    void this.purgeExpiredRefreshTokens();

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: params.scope,
    };
  }

  private async purgeExpiredRefreshTokens(): Promise<void> {
    try {
      await this.repository.deleteExpiredRefreshTokens();
    } catch (error) {
      this.logger.warn(
        `No se pudieron purgar refresh tokens: ${String(error)}`,
      );
    }
  }
}
