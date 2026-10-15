import { Injectable } from '@nestjs/common';
import type { TokenResponse } from '../interfaces/oauth.interface';
import { verifyPkce } from '../lib/pkce';
import { AuthorizationCodeStore } from '../stores/authorization-code.store';
import { IssueTokensUseCase } from './issue-tokens.use-case';

export interface ExchangeCodeInput {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}

/** Canjea un código de autorización por tokens (valida PKCE y un solo uso). */
@Injectable()
export class ExchangeCodeUseCase {
  constructor(
    private readonly codes: AuthorizationCodeStore,
    private readonly issueTokens: IssueTokensUseCase,
  ) {}

  async execute(input: ExchangeCodeInput): Promise<TokenResponse | null> {
    const record = this.codes.consume(input.code);
    if (!record) return null;
    if (
      record.client_id !== input.clientId ||
      record.redirect_uri !== input.redirectUri
    ) {
      return null;
    }
    if (
      !verifyPkce(
        input.codeVerifier,
        record.code_challenge,
        record.code_challenge_method,
      )
    ) {
      return null;
    }
    return this.issueTokens.execute({
      client_id: record.client_id,
      scope: record.scope,
      resource: record.resource,
    });
  }
}
