import { Injectable, HttpException, Logger } from '@nestjs/common';
import { envs } from '../../config/envs';

export interface CentralizadoRequestOptions {
  bearerToken?: string;
  timeout?: number;
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
        const errorData = data as { message?: string; statusCode?: number };
        throw new HttpException(
          errorData.message ?? 'Error en servicio centralizado',
          errorData.statusCode ?? response.status,
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
}
