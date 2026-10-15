import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { OAUTH_SCOPE_DEFAULT } from '../constants/oauth.constants';
import type { ValidatedAuthorize } from '../interfaces/oauth.interface';
import { OAuthConfigService } from '../oauth-config.service';
import { McpOAuthRepository } from '../persistence/mcp-oauth.repository';
import { AuthorizationCodeStore } from '../stores/authorization-code.store';

export interface AuthorizeParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
  state?: string;
  resource?: string;
}

/**
 * Valida una petición de `/oauth/authorize` y emite el código de autorización.
 * La validación se separa de la emisión para poder mostrar el consentimiento
 * (GET) antes de crear el código (POST).
 */
@Injectable()
export class AuthorizeUseCase {
  constructor(
    private readonly repository: McpOAuthRepository,
    private readonly codes: AuthorizationCodeStore,
    private readonly config: OAuthConfigService,
  ) {}

  async validate(
    params: AuthorizeParams,
    request: Request,
  ): Promise<ValidatedAuthorize | { error: string }> {
    const clientId = params.client_id;
    const redirectUri = params.redirect_uri;
    if (!clientId || !redirectUri) {
      return { error: 'Falta client_id o redirect_uri' };
    }
    if (params.response_type !== 'code') {
      return { error: 'response_type debe ser "code"' };
    }
    if (!params.code_challenge || params.code_challenge_method !== 'S256') {
      return { error: 'Se requiere PKCE con code_challenge_method=S256' };
    }

    const client = await this.repository.findClient(clientId);
    if (!client || !client.estado) {
      return { error: 'client_id desconocido o inactivo' };
    }
    if (!client.redirect_uris.includes(redirectUri)) {
      return { error: 'redirect_uri no registrada para este cliente' };
    }

    return {
      client,
      redirectUri,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      scope: params.scope || OAUTH_SCOPE_DEFAULT,
      state: params.state ?? '',
      resource: params.resource || this.config.resourceFor(request),
    };
  }

  createCode(validated: ValidatedAuthorize): string {
    return this.codes.create({
      client_id: validated.client.client_id,
      redirect_uri: validated.redirectUri,
      code_challenge: validated.codeChallenge,
      code_challenge_method: validated.codeChallengeMethod,
      scope: validated.scope,
      resource: validated.resource,
    });
  }
}
