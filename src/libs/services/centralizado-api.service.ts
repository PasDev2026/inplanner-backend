import { Injectable } from '@nestjs/common';
import { CentralizadoHttpClient } from '../centralizado-http/centralizado-http.client';
import type { CentralizadoEnvelope } from '../../app/auth/interfaces/auth-types';

interface RolResponse {
  uuid_rol: string;
  nombre: string;
  codigo: string;
  es_sistema: boolean;
  estado: boolean;
}

interface SedeResponse {
  uuid_sede: string;
  nombre: string;
  subdominio: string;
  direccion: string | null;
  hora_atencion: string | null;
  estado: boolean;
}

@Injectable()
export class CentralizadoApiService {
  constructor(private readonly http: CentralizadoHttpClient) {}

  async getRoles(bearerToken: string) {
    const env = await this.http.get<CentralizadoEnvelope<RolResponse[]>>(
      '/roles',
      {
        bearerToken,
      },
    );
    return env.data
      .filter((r) => r.estado)
      .map((r) => ({ id: r.uuid_rol, nombre: r.nombre }));
  }

  async getSedes(bearerToken: string) {
    const env = await this.http.get<CentralizadoEnvelope<SedeResponse[]>>(
      '/sedes',
      {
        bearerToken,
      },
    );
    return env.data
      .filter((s) => s.estado)
      .map((s) => ({
        id: s.uuid_sede,
        nombre: s.nombre.replace(/^INSALUD\s+/i, '').trim(),
      }));
  }
}
