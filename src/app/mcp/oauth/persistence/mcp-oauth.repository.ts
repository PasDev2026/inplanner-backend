import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DB_SCHEMA } from '../../../../config/schema';
import type {
  OAuthClientRow,
  RefreshTokenRow,
} from '../interfaces/oauth.interface';

export interface NewClient {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
}

export interface NewRefreshToken {
  token_hash: string;
  client_id: string;
  scope: string;
  resource: string;
  expires_at: Date;
}

/**
 * Persistencia del servidor OAuth del MCP (tablas `oauth_clients` y
 * `oauth_refresh_tokens`). SQL parametrizado; solo el esquema se interpola.
 */
@Injectable()
export class McpOAuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  async createClient(client: NewClient): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO ${DB_SCHEMA}.oauth_clients
         (client_id, client_name, redirect_uris, token_endpoint_auth_method)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [
        client.client_id,
        client.client_name,
        JSON.stringify(client.redirect_uris),
        client.token_endpoint_auth_method,
      ],
    );
  }

  async findClient(clientId: string): Promise<OAuthClientRow | null> {
    const rows = await this.dataSource.query<OAuthClientRow[]>(
      `SELECT client_id, client_name, redirect_uris, token_endpoint_auth_method,
              estado, created_at
       FROM ${DB_SCHEMA}.oauth_clients
       WHERE client_id = $1`,
      [clientId],
    );
    return rows[0] ?? null;
  }

  async createRefreshToken(token: NewRefreshToken): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO ${DB_SCHEMA}.oauth_refresh_tokens
         (token_hash, client_id, scope, resource, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        token.token_hash,
        token.client_id,
        token.scope,
        token.resource,
        token.expires_at,
      ],
    );
  }

  async findActiveRefreshToken(
    tokenHash: string,
  ): Promise<RefreshTokenRow | null> {
    const rows = await this.dataSource.query<RefreshTokenRow[]>(
      `SELECT id, token_hash, client_id, scope, resource, revoked, expires_at, created_at
       FROM ${DB_SCHEMA}.oauth_refresh_tokens
       WHERE token_hash = $1 AND revoked = false AND expires_at > now()`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE ${DB_SCHEMA}.oauth_refresh_tokens
       SET revoked = true
       WHERE token_hash = $1`,
      [tokenHash],
    );
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM ${DB_SCHEMA}.oauth_refresh_tokens WHERE expires_at < now()`,
    );
  }
}
