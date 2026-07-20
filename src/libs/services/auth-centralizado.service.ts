import { Injectable } from '@nestjs/common';
import { CentralizadoHttpClient } from '../centralizado-http/centralizado-http.client';
import { LoginDto } from '../../app/auth/dtos/login.dto';
import type {
  LoginResponse,
  RefreshResponse,
  CentralizadoEnvelope,
  TokenData,
} from '../../app/auth/interfaces/auth-types';

@Injectable()
export class AuthCentralizadoService {
  constructor(private readonly http: CentralizadoHttpClient) {}

  async login(payload: LoginDto): Promise<LoginResponse> {
    const env = await this.http.post<LoginDto, CentralizadoEnvelope<TokenData>>(
      '/auth/login',
      payload,
    );
    return env.data;
  }

  async refresh(payload: { refresh_token: string }): Promise<RefreshResponse> {
    const env = await this.http.post<
      { refresh_token: string },
      CentralizadoEnvelope<TokenData>
    >('/auth/refresh', payload);
    return env.data;
  }

  async logout(accessToken: string): Promise<void> {
    await this.http.post<Record<string, never>, CentralizadoEnvelope<unknown>>(
      '/auth/logout',
      {},
      { bearerToken: accessToken },
    );
  }

  async changePassword(
    payload: {
      password_actual: string;
      password_nueva: string;
      repetir_password: string;
    },
    accessToken: string,
  ): Promise<{ mensaje: string }> {
    const env = await this.http.patch<
      {
        password_actual: string;
        password_nueva: string;
        repetir_password: string;
      },
      CentralizadoEnvelope<{ mensaje: string }>
    >('/auth/change-password', payload, { bearerToken: accessToken });
    return env.data;
  }
}
