import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { MCP_TOKEN_ENV_KEY } from '../constants/mcp.constants';
import { OAUTH_ADMIN_PASSWORD_ENV } from './constants/oauth.constants';
import { verifyPkce } from './lib/pkce';
import { OAuthConfigService } from './oauth-config.service';
import type { McpOAuthRepository } from './persistence/mcp-oauth.repository';
import { AuthorizationCodeStore } from './stores/authorization-code.store';
import { AuthorizeUseCase } from './use-cases/authorize.use-case';
import { ExchangeCodeUseCase } from './use-cases/exchange-code.use-case';
import { IssueTokensUseCase } from './use-cases/issue-tokens.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterClientUseCase } from './use-cases/register-client.use-case';
import { VerifyAccessTokenUseCase } from './use-cases/verify-access-token.use-case';

const SIGNING_SECRET = 'test-signing-secret';
const ADMIN_PASSWORD = 'admin-pass';
const RESOURCE = 'https://mcp.test/api/v1/mcp';

const MOCK_CLIENT = {
  client_id: 'c1',
  client_name: 'Test Client',
  redirect_uris: ['https://x/cb'],
  token_endpoint_auth_method: 'none',
  estado: true,
  created_at: new Date(),
};

function makeRepository() {
  return {
    createClient: jest.fn().mockResolvedValue(undefined),
    findClient: jest.fn().mockResolvedValue(null),
    createRefreshToken: jest.fn().mockResolvedValue(undefined),
    findActiveRefreshToken: jest.fn().mockResolvedValue(null),
    revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    deleteExpiredRefreshTokens: jest.fn().mockResolvedValue(undefined),
  };
}

function makeContext() {
  const repository = makeRepository();
  const config = {
    get: (key: string) => {
      if (key === MCP_TOKEN_ENV_KEY) return SIGNING_SECRET;
      if (key === OAUTH_ADMIN_PASSWORD_ENV) return ADMIN_PASSWORD;
      return undefined;
    },
  } as unknown as ConfigService;

  const oauthConfig = new OAuthConfigService(config);
  const jwt = new JwtService({
    secret: SIGNING_SECRET,
    signOptions: { algorithm: 'HS256' },
  });
  const repo = repository as unknown as McpOAuthRepository;
  const codes = new AuthorizationCodeStore();
  const issueTokens = new IssueTokensUseCase(jwt, repo, oauthConfig);

  return {
    repository,
    oauthConfig,
    codes,
    registerClient: new RegisterClientUseCase(repo),
    authorize: new AuthorizeUseCase(repo, codes, oauthConfig),
    issueTokens,
    exchangeCode: new ExchangeCodeUseCase(codes, issueTokens),
    refreshToken: new RefreshTokenUseCase(repo, issueTokens),
    verifyAccessToken: new VerifyAccessTokenUseCase(jwt, oauthConfig),
  };
}

const request = {
  headers: { host: 'mcp.test', 'x-forwarded-proto': 'https' },
} as unknown as Request;

const hashOf = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

describe('OAuthConfigService', () => {
  it('isConfigured requiere token y contraseña', () => {
    const { oauthConfig } = makeContext();
    expect(oauthConfig.isConfigured()).toBe(true);
  });

  it('deriva issuer y recurso del request', () => {
    const { oauthConfig } = makeContext();
    expect(oauthConfig.issuerFor(request)).toBe('https://mcp.test');
    expect(oauthConfig.resourceFor(request)).toBe(RESOURCE);
    expect(oauthConfig.resourceMetadataUrl(request)).toBe(
      'https://mcp.test/.well-known/oauth-protected-resource',
    );
  });

  it('checkAdminPassword compara en tiempo constante', () => {
    const { oauthConfig } = makeContext();
    expect(oauthConfig.checkAdminPassword(ADMIN_PASSWORD)).toBe(true);
    expect(oauthConfig.checkAdminPassword('otra')).toBe(false);
    expect(oauthConfig.checkAdminPassword('')).toBe(false);
  });
});

describe('PKCE', () => {
  it('valida S256 y rechaza otros métodos', () => {
    const challenge = hashOf('verifier-123');
    expect(verifyPkce('verifier-123', challenge, 'S256')).toBe(true);
    expect(verifyPkce('otro', challenge, 'S256')).toBe(false);
    expect(verifyPkce('verifier-123', challenge, 'plain')).toBe(false);
  });
});

describe('RegisterClientUseCase', () => {
  it('genera un uuid y persiste el cliente', async () => {
    const { registerClient, repository } = makeContext();
    const client = await registerClient.execute({
      redirect_uris: ['https://claude.ai/callback'],
    });
    expect(client.client_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(repository.createClient).toHaveBeenCalledWith(client);
  });
});

describe('AuthorizationCodeStore', () => {
  it('el código es de un solo uso', () => {
    const { codes } = makeContext();
    const code = codes.create({
      client_id: 'c1',
      redirect_uri: 'https://x/cb',
      code_challenge: 'ch',
      code_challenge_method: 'S256',
      scope: 'mcp',
      resource: RESOURCE,
    });
    expect(codes.consume(code)).not.toBeNull();
    expect(codes.consume(code)).toBeNull();
  });
});

describe('AuthorizeUseCase', () => {
  it('valida una petición correcta', async () => {
    const { authorize, repository } = makeContext();
    repository.findClient.mockResolvedValue(MOCK_CLIENT);

    const result = await authorize.validate(
      {
        client_id: 'c1',
        redirect_uri: 'https://x/cb',
        response_type: 'code',
        code_challenge: 'ch',
        code_challenge_method: 'S256',
        scope: 'mcp',
        state: 's',
      },
      request,
    );
    expect('error' in result).toBe(false);
  });

  it('rechaza una redirect_uri no registrada', async () => {
    const { authorize, repository } = makeContext();
    repository.findClient.mockResolvedValue(MOCK_CLIENT);

    const result = await authorize.validate(
      {
        client_id: 'c1',
        redirect_uri: 'https://evil/cb',
        response_type: 'code',
        code_challenge: 'ch',
        code_challenge_method: 'S256',
      },
      request,
    );
    expect('error' in result).toBe(true);
    const message = 'error' in result ? result.error : '';
    expect(message).toContain('redirect_uri');
  });

  it('exige PKCE S256', async () => {
    const { authorize, repository } = makeContext();
    repository.findClient.mockResolvedValue(MOCK_CLIENT);

    const result = await authorize.validate(
      { client_id: 'c1', redirect_uri: 'https://x/cb', response_type: 'code' },
      request,
    );
    const message = 'error' in result ? result.error : '';
    expect(message).toContain('PKCE');
  });
});

describe('IssueTokensUseCase + VerifyAccessTokenUseCase', () => {
  it('emite tokens y los verifica por audiencia', async () => {
    const { issueTokens, verifyAccessToken } = makeContext();
    const tokens = await issueTokens.execute({
      client_id: 'c1',
      scope: 'mcp',
      resource: RESOURCE,
    });
    expect(tokens.refresh_token).toBeTruthy();
    expect(await verifyAccessToken.execute(tokens.access_token, RESOURCE)).toBe(
      true,
    );
    expect(
      await verifyAccessToken.execute(tokens.access_token, 'https://otro/x'),
    ).toBe(false);
    expect(await verifyAccessToken.execute('no-jwt', RESOURCE)).toBe(false);
  });

  it('guarda el refresh token hasheado', async () => {
    const { issueTokens, repository } = makeContext();
    const tokens = await issueTokens.execute({
      client_id: 'c1',
      scope: 'mcp',
      resource: RESOURCE,
    });
    const expectedHash = createHash('sha256')
      .update(tokens.refresh_token as string)
      .digest('hex');
    expect(repository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({ token_hash: expectedHash, client_id: 'c1' }),
    );
  });
});

describe('ExchangeCodeUseCase', () => {
  it('canjea el código con PKCE válido', async () => {
    const { codes, exchangeCode } = makeContext();
    const verifier = 'verifier-abc';
    const code = codes.create({
      client_id: 'c1',
      redirect_uri: 'https://x/cb',
      code_challenge: hashOf(verifier),
      code_challenge_method: 'S256',
      scope: 'mcp',
      resource: RESOURCE,
    });

    const tokens = await exchangeCode.execute({
      code,
      clientId: 'c1',
      redirectUri: 'https://x/cb',
      codeVerifier: verifier,
    });
    expect(tokens?.access_token).toBeTruthy();
  });

  it('rechaza un code_verifier incorrecto', async () => {
    const { codes, exchangeCode } = makeContext();
    const code = codes.create({
      client_id: 'c1',
      redirect_uri: 'https://x/cb',
      code_challenge: hashOf('verifier-abc'),
      code_challenge_method: 'S256',
      scope: 'mcp',
      resource: RESOURCE,
    });

    const tokens = await exchangeCode.execute({
      code,
      clientId: 'c1',
      redirectUri: 'https://x/cb',
      codeVerifier: 'otro-verifier',
    });
    expect(tokens).toBeNull();
  });
});

describe('RefreshTokenUseCase', () => {
  it('rota el refresh token y revoca el anterior', async () => {
    const { refreshToken, repository } = makeContext();
    repository.findActiveRefreshToken.mockResolvedValue({
      id: 'id',
      token_hash: 'hash',
      client_id: 'c1',
      scope: 'mcp',
      resource: RESOURCE,
      revoked: false,
      expires_at: new Date(Date.now() + 1000),
      created_at: new Date(),
    });

    const tokens = await refreshToken.execute('refresh-viejo', RESOURCE);
    expect(repository.revokeRefreshToken).toHaveBeenCalled();
    expect(tokens).not.toBeNull();
  });

  it('rechaza si el recurso no coincide', async () => {
    const { refreshToken, repository } = makeContext();
    repository.findActiveRefreshToken.mockResolvedValue({
      id: 'id',
      token_hash: 'hash',
      client_id: 'c1',
      scope: 'mcp',
      resource: RESOURCE,
      revoked: false,
      expires_at: new Date(Date.now() + 1000),
      created_at: new Date(),
    });

    expect(
      await refreshToken.execute('refresh-viejo', 'https://otro/x'),
    ).toBeNull();
  });
});
