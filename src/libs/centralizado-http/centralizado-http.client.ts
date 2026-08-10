import { Injectable, HttpException, Logger } from '@nestjs/common';
import { envs } from '../../config/envs';

export interface CentralizadoRequestOptions {
  bearerToken?: string;
  timeout?: number;
  extraHeaders?: Record<string, string>;
}

@Injectable()
export class CentralizadoHttpClient {
  private readonly baseUrl = envs.centralizadoApiUrl;
  private readonly logger = new Logger(CentralizadoHttpClient.name);
  private readonly defaultTimeout = 10_000;

  async post<TBody, TResponse>(
    path: string,
    body: TBody,
    options?: CentralizadoRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('POST', path, body, options);
  }

  async get<TResponse>(
    path: string,
    options?: CentralizadoRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('GET', path, undefined, options);
  }

  async patch<TBody, TResponse>(
    path: string,
    body: TBody,
    options?: CentralizadoRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('PATCH', path, body, options);
  }

  async delete<TResponse>(
    path: string,
    options?: CentralizadoRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path, undefined, options);
  }

  private async request<TResponse>(
    method: string,
    path: string,
    body: unknown,
    options?: CentralizadoRequestOptions,
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (options?.bearerToken) {
      headers['Authorization'] = `Bearer ${options.bearerToken}`;
    }

    if (options?.extraHeaders) {
      Object.assign(headers, options.extraHeaders);
    }

    const timeout = options?.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data = (await response.json()) as TResponse;

      if (!response.ok) {
        const errorData = data as {
          message?: string | string[];
          error?: string;
          statusCode?: number;
        };
        this.logger.warn(
          `Centralizado ${method} ${url} respondió ${response.status}: ${JSON.stringify(errorData)}`,
        );
        const claims = this.decodeJwtClaims(options?.bearerToken);
        if (claims) {
          this.logger.warn(
            `Claims del token (diagnóstico): persona_id=${claims.persona_id} sede_id=${claims.sede_id}`,
          );
        }
        const statusCode = errorData.statusCode ?? response.status;
        const message =
          (typeof errorData.message === 'string' &&
            errorData.message.length > 0) ||
          (Array.isArray(errorData.message) && errorData.message.length > 0)
            ? errorData.message
            : (errorData.error ?? 'Error en servicio centralizado');
        throw new HttpException(
          { message, error: errorData.error, statusCode },
          statusCode,
        );
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Timeout llamando a ${url} (${timeout}ms)`);
        throw new HttpException('Servicio centralizado no responde', 504);
      }

      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error llamando a ${method} ${url}: ${message}`);
      throw new HttpException('Servicio centralizado no disponible', 503);
    } finally {
      clearTimeout(timer);
    }
  }

  private decodeJwtClaims(
    token?: string,
  ): { persona_id?: string; sede_id?: string } | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
      ) as {
        persona_id?: string;
        sede_activa?: { sede_id?: string };
      };
      return {
        persona_id: payload.persona_id,
        sede_id: payload.sede_activa?.sede_id,
      };
    } catch {
      return null;
    }
  }
}
