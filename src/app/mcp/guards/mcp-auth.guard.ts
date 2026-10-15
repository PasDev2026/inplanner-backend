import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  MCP_TOKEN_ENV_KEY,
  MCP_TOKEN_QUERY_PARAM,
} from '../constants/mcp.constants';

/**
 * Autentica las peticiones al endpoint MCP mediante un token dedicado
 * (`MCP_AUTH_TOKEN`), aceptado de dos formas:
 *  - `Authorization: Bearer <token>` (Claude Code, OpenCode, etc.)
 *  - `?token=<token>` en la URL (conector remoto de Claude, cuya UI
 *    solo admite la URL).
 *
 * Es intencionalmente independiente del `AuthGuard` global (que valida JWT
 * de la aplicación): el MCP se autentica con un token de servicio.
 */
@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = this.configService.get<string>(MCP_TOKEN_ENV_KEY);
    const providedToken = this.extractToken(request);

    if (!expectedToken || !providedToken) {
      throw new UnauthorizedException('Token MCP inválido o ausente');
    }
    if (!this.safeEqual(providedToken, expectedToken)) {
      throw new UnauthorizedException('Token MCP inválido o ausente');
    }
    return true;
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
