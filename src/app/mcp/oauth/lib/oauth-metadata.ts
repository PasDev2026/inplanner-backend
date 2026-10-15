import { OAUTH_PATHS, OAUTH_SCOPE_DEFAULT } from '../constants/oauth.constants';

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported: string[];
}

export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  scopes_supported: string[];
}

/** Metadata del recurso protegido (RFC 9728). */
export function buildProtectedResourceMetadata(
  issuer: string,
  resource: string,
): ProtectedResourceMetadata {
  return {
    resource,
    authorization_servers: [issuer],
    bearer_methods_supported: ['header'],
  };
}

/** Metadata del servidor de autorización (RFC 8414). */
export function buildAuthorizationServerMetadata(
  issuer: string,
): AuthorizationServerMetadata {
  return {
    issuer,
    authorization_endpoint: `${issuer}/${OAUTH_PATHS.authorize}`,
    token_endpoint: `${issuer}/${OAUTH_PATHS.token}`,
    registration_endpoint: `${issuer}/${OAUTH_PATHS.register}`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [OAUTH_SCOPE_DEFAULT],
  };
}
