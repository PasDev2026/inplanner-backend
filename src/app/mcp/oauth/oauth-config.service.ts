import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { MCP_TOKEN_ENV_KEY } from '../constants/mcp.constants';
import {
  MCP_RESOURCE_PATH,
  OAUTH_ADMIN_PASSWORD_ENV,
  OAUTH_PUBLIC_URL_ENV,
} from './constants/oauth.constants';
import { safeEqual } from './lib/crypto.util';

/**
 * Configuración y derivación del servidor OAuth del MCP:
 * issuer/recurso a partir del request, secreto de firma y contraseña de admin.
 */
@Injectable()
export class OAuthConfigService {
  constructor(private readonly config: ConfigService) {}

  /** Requiere el token de servicio y la contraseña de admin configurados. */
  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>(MCP_TOKEN_ENV_KEY) &&
      this.config.get<string>(OAUTH_ADMIN_PASSWORD_ENV),
    );
  }

  get signingSecret(): string {
    return this.config.get<string>(MCP_TOKEN_ENV_KEY) ?? '';
  }

  /** Issuer derivado del request (o forzado por `MCP_PUBLIC_URL`). */
  issuerFor(request: Request): string {
    const override = this.config.get<string>(OAUTH_PUBLIC_URL_ENV);
    if (override) return override.replace(/\/+$/, '');

    const proto = firstHeader(request.headers['x-forwarded-proto']) ?? 'http';
    const host =
      firstHeader(request.headers['x-forwarded-host']) ??
      request.headers.host ??
      'localhost';
    return `${proto}://${host}`;
  }

  resourceFor(request: Request): string {
    return `${this.issuerFor(request)}${MCP_RESOURCE_PATH}`;
  }

  resourceMetadataUrl(request: Request): string {
    return `${this.issuerFor(request)}/.well-known/oauth-protected-resource`;
  }

  checkAdminPassword(password: string): boolean {
    const expected = this.config.get<string>(OAUTH_ADMIN_PASSWORD_ENV) ?? '';
    if (!expected || !password) return false;
    return safeEqual(password, expected);
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
