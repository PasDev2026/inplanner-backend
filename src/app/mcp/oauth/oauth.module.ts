import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MCP_TOKEN_ENV_KEY } from '../constants/mcp.constants';
import { ACCESS_TOKEN_TTL_SECONDS } from './constants/oauth.constants';
import { McpOAuthController } from './oauth.controller';
import { OAuthConfigService } from './oauth-config.service';
import { McpOAuthRepository } from './persistence/mcp-oauth.repository';
import { AuthorizationCodeStore } from './stores/authorization-code.store';
import { AuthorizeUseCase } from './use-cases/authorize.use-case';
import { ExchangeCodeUseCase } from './use-cases/exchange-code.use-case';
import { IssueTokensUseCase } from './use-cases/issue-tokens.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterClientUseCase } from './use-cases/register-client.use-case';
import { VerifyAccessTokenUseCase } from './use-cases/verify-access-token.use-case';

/**
 * Servidor OAuth 2.1 mínimo del MCP.
 *
 * Registra su propio `JwtModule` (HS256) usando `MCP_AUTH_TOKEN` como secreto
 * de firma, para no mezclarlo con el JWT (RS256) de la aplicación.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>(MCP_TOKEN_ENV_KEY) ?? 'mcp-oauth-not-configured',
        signOptions: {
          algorithm: 'HS256',
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [McpOAuthController],
  providers: [
    OAuthConfigService,
    McpOAuthRepository,
    AuthorizationCodeStore,
    RegisterClientUseCase,
    AuthorizeUseCase,
    IssueTokensUseCase,
    ExchangeCodeUseCase,
    RefreshTokenUseCase,
    VerifyAccessTokenUseCase,
  ],
  exports: [OAuthConfigService, VerifyAccessTokenUseCase],
})
export class McpOAuthModule {}
