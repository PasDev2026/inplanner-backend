import { MCP_FULL_ENDPOINT_PATH } from '../../constants/mcp.constants';

/** Rutas OAuth/MCP que van en la RAÍZ (fuera del prefijo `api/v1`). */
export const OAUTH_PATHS = {
  protectedResource: '.well-known/oauth-protected-resource',
  protectedResourceMcp: `.well-known/oauth-protected-resource${MCP_FULL_ENDPOINT_PATH}`,
  authServerMetadata: '.well-known/oauth-authorization-server',
  register: 'oauth/register',
  authorize: 'oauth/authorize',
  token: 'oauth/token',
} as const;

/**
 * Path del recurso protegido (el endpoint MCP).
 * Derivado de la fuente única en `mcp.constants.ts`.
 */
export const MCP_RESOURCE_PATH = MCP_FULL_ENDPOINT_PATH;

/** Variable de entorno con la contraseña para aprobar el consentimiento. */
export const OAUTH_ADMIN_PASSWORD_ENV = 'MCP_OAUTH_ADMIN_PASSWORD';

/** Variable opcional para forzar el issuer (útil detrás de proxies). */
export const OAUTH_PUBLIC_URL_ENV = 'MCP_PUBLIC_URL';

export const ACCESS_TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 h
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 días
export const AUTH_CODE_TTL_SECONDS = 60; // 1 min

export const OAUTH_SCOPE_DEFAULT = 'mcp';
