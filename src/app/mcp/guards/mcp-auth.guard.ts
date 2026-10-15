import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  MCP_TOKEN_ENV_KEY,
  MCP_TOKEN_QUERY_PARAM,
} from '../constants/mcp.constants';
import { OAuthConfigService } from '../oauth/oauth-config.service';
import { VerifyAccessTokenUseCase } from '../oauth/use-cases/verify-access-token.use-case';

/**
 * Autentica las peticiones al endpoint MCP. Acepta:
 *  1. El token de servicio (`MCP_AUTH_TOKEN`), por header `Authorization: Bearer`
 *     o por query `?token=` (OpenCode, Claude Code, conector con token en URL).
 *  2. Un **access token OAuth** válido emitido por el servidor OAuth del MCP
 *     (conector de Claude sin token en la URL).
 *
 * Es intencionalmente independiente del `AuthGuard` global (JWT de la app).
 */
@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthConfig: OAuthConfigService,
    private readonly verifyAccessToken: VerifyAccessTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = this.configService.get<string>(MCP_TOKEN_ENV_KEY);
    const providedToken = this.extractToken(request);

    // 1) Token de servicio
    if (
      expectedToken &&
      providedToken &&
      this.safeEqual(providedToken, expectedToken)
    ) {
      return true;
    }

    // 2) Access token OAuth
    if (providedToken && this.oauthConfig.isConfigured()) {
      const valid = await this.verifyAccessToken.execute(
        providedToken,
        this.oauthConfig.resourceFor(request),
      );
      if (valid) return true;
    }

    this.setChallenge(context, request);
    throw new UnauthorizedException('Token MCP inválido o ausente');
  }

  /** RFC 9728: indica al cliente dónde descubrir el servidor de autorización. */
  private setChallenge(context: ExecutionContext, request: Request): void {
    if (!this.oauthConfig.isConfigured()) return;
    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader(
      'WWW-Authenticate',
      `Bearer resource_metadata="${this.oauthConfig.resourceMetadataUrl(request)}"`,
    );
  }

  /**
   * Extrae el token del header `Authorization: Bearer` o, si no está,
   * del query param `?token=`.
   */
  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;

    const queryToken = request.query?.[MCP_TOKEN_QUERY_PARAM];
    return typeof queryToken === 'string' ? queryToken : undefined;
  }

  /** Comparación en tiempo constante para no filtrar información por timing. */
  private safeEqual(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  }
}
