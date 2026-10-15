import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipTransform } from '../../../common/decorators/skip-transform.decorator';
import { OAUTH_PATHS } from './constants/oauth.constants';
import type {
  RegisteredClient,
  TokenResponse,
  ValidatedAuthorize,
} from './interfaces/oauth.interface';
import {
  buildConsentCsp,
  renderConsentPage,
  renderErrorPage,
} from './lib/consent-page';
import {
  buildAuthorizationServerMetadata,
  buildProtectedResourceMetadata,
} from './lib/oauth-metadata';
import { OAuthConfigService } from './oauth-config.service';
import { OAuthException } from './errors/oauth.exception';
import { OAuthExceptionFilter } from './errors/oauth-exception.filter';
import {
  AuthorizeUseCase,
  type AuthorizeParams,
} from './use-cases/authorize.use-case';
import { ExchangeCodeUseCase } from './use-cases/exchange-code.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterClientUseCase } from './use-cases/register-client.use-case';

interface RegisterBody {
  client_name?: string;
  redirect_uris?: unknown;
  token_endpoint_auth_method?: string;
}

interface ApproveBody extends AuthorizeParams {
  password?: string;
}

interface TokenBody {
  grant_type?: string;
  code?: string;
  redirect_uri?: string;
  client_id?: string;
  code_verifier?: string;
  refresh_token?: string;
}

/**
 * Endpoints OAuth 2.1 del MCP (en la RAÍZ, excluidos del prefijo `api/v1`).
 *
 * Los endpoints JSON retornan objetos y lanzan `OAuthException` (formateada
 * por `OAuthExceptionFilter`). Solo se usa `@Res()` donde es imprescindible:
 * HTML del consentimiento y redirect.
 */
@Controller()
@Public()
@SkipTransform()
@UseFilters(OAuthExceptionFilter)
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class McpOAuthController {
  constructor(
    private readonly config: OAuthConfigService,
    private readonly registerClient: RegisterClientUseCase,
    private readonly authorize: AuthorizeUseCase,
    private readonly exchangeCode: ExchangeCodeUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
  ) {}

  // ---- Descubrimiento ----

  @Get(OAUTH_PATHS.protectedResource)
  protectedResource(@Req() req: Request) {
    return this.protectedResourceMetadata(req);
  }

  @Get(OAUTH_PATHS.protectedResourceMcp)
  protectedResourceMcp(@Req() req: Request) {
    return this.protectedResourceMetadata(req);
  }

  @Get(OAUTH_PATHS.authServerMetadata)
  authServerMetadata(@Req() req: Request) {
    return buildAuthorizationServerMetadata(this.config.issuerFor(req));
  }

  // ---- Registro dinámico (DCR) ----

  @Post(OAUTH_PATHS.register)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async register(@Body() body: RegisterBody): Promise<RegisteredClient> {
    if (!this.config.isConfigured()) {
      throw new OAuthException('server_error', 503, 'OAuth no configurado');
    }
    const redirectUris = Array.isArray(body.redirect_uris)
      ? body.redirect_uris.filter(
          (uri): uri is string => typeof uri === 'string',
        )
      : [];
    if (redirectUris.length === 0) {
      throw new OAuthException(
        'invalid_redirect_uri',
        400,
        'redirect_uris es requerido',
      );
    }

    return this.registerClient.execute({
      client_name: body.client_name,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: body.token_endpoint_auth_method,
    });
  }

  // ---- Autorización (consentimiento, HTML + redirect) ----

  @Get(OAUTH_PATHS.authorize)
  async authorizeForm(
    @Query() query: AuthorizeParams,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.config.isConfigured()) {
      return this.renderError(res, 503, 'OAuth no configurado');
    }
    const validated = await this.authorize.validate(query, req);
    if ('error' in validated) {
      return this.renderError(res, 400, validated.error);
    }
    this.applyConsentCsp(res, validated.redirectUri);
    res.type('html').send(this.renderConsent(validated, query, false));
  }

  @Post(OAUTH_PATHS.authorize)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async approve(
    @Body() body: ApproveBody,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.config.isConfigured()) {
      return this.renderError(res, 503, 'OAuth no configurado');
    }
    const validated = await this.authorize.validate(body, req);
    if ('error' in validated) {
      return this.renderError(res, 400, validated.error);
    }
    this.applyConsentCsp(res, validated.redirectUri);
    if (!this.config.checkAdminPassword(body.password ?? '')) {
      res
        .status(401)
        .type('html')
        .send(this.renderConsent(validated, body, true));
      return;
    }

    const location = new URL(validated.redirectUri);
    location.searchParams.set('code', this.authorize.createCode(validated));
    if (validated.state) location.searchParams.set('state', validated.state);
    res.redirect(location.toString());
  }

  // ---- Token ----

  @Post(OAUTH_PATHS.token)
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async token(
    @Body() body: TokenBody,
    @Req() req: Request,
  ): Promise<TokenResponse> {
    if (!this.config.isConfigured()) {
      throw new OAuthException('server_error', 503, 'OAuth no configurado');
    }
    const grantType = String(body.grant_type ?? '');

    if (grantType === 'authorization_code') {
      if (
        !body.code ||
        !body.client_id ||
        !body.code_verifier ||
        !body.redirect_uri
      ) {
        throw new OAuthException('invalid_request', 400, 'Faltan parámetros');
      }
      const tokens = await this.exchangeCode.execute({
        code: String(body.code),
        clientId: String(body.client_id),
        redirectUri: String(body.redirect_uri),
        codeVerifier: String(body.code_verifier),
      });
      if (!tokens) {
        throw new OAuthException(
          'invalid_grant',
          400,
          'Código inválido o expirado',
        );
      }
      return tokens;
    }

    if (grantType === 'refresh_token') {
      if (!body.refresh_token) {
        throw new OAuthException(
          'invalid_request',
          400,
          'refresh_token requerido',
        );
      }
      const tokens = await this.refreshToken.execute(
        String(body.refresh_token),
        this.config.resourceFor(req),
      );
      if (!tokens) {
        throw new OAuthException(
          'invalid_grant',
          400,
          'Refresh token inválido',
        );
      }
      return tokens;
    }

    throw new OAuthException(
      'unsupported_grant_type',
      400,
      `grant_type no soportado: ${grantType}`,
    );
  }

  // ---- Helpers (solo HTML) ----

  private protectedResourceMetadata(req: Request) {
    return buildProtectedResourceMetadata(
      this.config.issuerFor(req),
      this.config.resourceFor(req),
    );
  }

  private renderConsent(
    validated: ValidatedAuthorize,
    params: AuthorizeParams,
    showError: boolean,
  ): string {
    return renderConsentPage(
      {
        clientName: validated.client.client_name ?? validated.client.client_id,
        client_id: params.client_id ?? '',
        redirect_uri: params.redirect_uri ?? '',
        response_type: params.response_type ?? '',
        code_challenge: params.code_challenge ?? '',
        code_challenge_method: params.code_challenge_method ?? '',
        scope: params.scope ?? '',
        state: params.state ?? '',
        resource: params.resource ?? '',
      },
      showError,
    );
  }

  private applyConsentCsp(res: Response, redirectUri: string): void {
    res.setHeader(
      'Content-Security-Policy',
      buildConsentCsp(new URL(redirectUri).origin),
    );
  }

  private renderError(res: Response, status: number, message: string): void {
    res.status(status).type('html').send(renderErrorPage(message));
  }
}
