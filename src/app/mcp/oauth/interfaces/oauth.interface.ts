/** Cliente OAuth registrado dinámicamente (DCR). */
export interface RegisteredClient {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
}

/** Fila de `oauth_clients`. */
export interface OAuthClientRow extends RegisteredClient {
  estado: boolean;
  created_at: Date;
}

/** Fila de `oauth_refresh_tokens`. */
export interface RefreshTokenRow {
  id: string;
  token_hash: string;
  client_id: string;
  scope: string | null;
  resource: string;
  revoked: boolean;
  expires_at: Date;
  created_at: Date;
}

/** Código de autorización (efímero, en memoria). */
export interface AuthCodeRecord {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  resource: string;
  expiresAt: number;
}

/** Respuesta del endpoint `/oauth/token`. */
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/** Parámetros de `/oauth/authorize` ya validados. */
export interface ValidatedAuthorize {
  client: RegisteredClient;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  state: string;
  resource: string;
}
