import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RegisteredClient } from '../interfaces/oauth.interface';
import { McpOAuthRepository } from '../persistence/mcp-oauth.repository';

export interface RegisterClientInput {
  client_name?: string;
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
}

/** Registro dinámico de cliente (DCR, RFC 7591). */
@Injectable()
export class RegisterClientUseCase {
  constructor(private readonly repository: McpOAuthRepository) {}

  async execute(input: RegisterClientInput): Promise<RegisteredClient> {
    const client: RegisteredClient = {
      client_id: randomUUID(),
      client_name: input.client_name ?? null,
      redirect_uris: input.redirect_uris,
      token_endpoint_auth_method: input.token_endpoint_auth_method ?? 'none',
    };
    await this.repository.createClient(client);
    return client;
  }
}
