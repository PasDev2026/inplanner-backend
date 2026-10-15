import { Injectable } from '@nestjs/common';
import { OAUTH_SCOPE_DEFAULT } from '../constants/oauth.constants';
import type { TokenResponse } from '../interfaces/oauth.interface';
import { hashToken } from '../lib/crypto.util';
import { McpOAuthRepository } from '../persistence/mcp-oauth.repository';
import { IssueTokensUseCase } from './issue-tokens.use-case';

/** Rota un refresh token: revoca el anterior y emite un nuevo par de tokens. */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly repository: McpOAuthRepository,
    private readonly issueTokens: IssueTokensUseCase,
  ) {}

  async execute(
    refreshToken: string,
    resource: string,
  ): Promise<TokenResponse | null> {
    const hash = hashToken(refreshToken);
    const record = await this.repository.findActiveRefreshToken(hash);
    if (!record || record.resource !== resource) return null;

    await this.repository.revokeRefreshToken(hash);
    return this.issueTokens.execute({
      client_id: record.client_id,
      scope: record.scope ?? OAUTH_SCOPE_DEFAULT,
      resource: record.resource,
    });
  }
}
