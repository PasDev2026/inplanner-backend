import { Injectable } from '@nestjs/common';
import { CentralizadoHttpClient } from '../centralizado-http/centralizado-http.client';
import type { CentralizadoEnvelope } from '../../app/auth/interfaces/auth-types';

export interface CreateTrabajadorAsignacion {
  sede_uuid: string;
  rol_uuid: string;
  especialidad_uuids: string[];
}

export interface CreateTrabajadorPayload {
  tipo_documento_uuid: string;
  numero_documento: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string;
  sexo: string;
  email: string;
  telefono?: string;
  direccion?: string;
  password: string;
  repetir_password: string;
  asignaciones: CreateTrabajadorAsignacion[];
}

export interface CreateTrabajadorResult {
  mensaje: string;
  usuario_uuid: string;
}

export interface TrabajadorDetalle {
  usuario_uuid: string;
  persona_uuid: string;
  numero_documento: string;
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string | null;
  telefono: string | null;
}

export interface TipoDocumento {
  uuid_tipo_documento: string;
  nombre: string;
  codigo: string;
  estado?: boolean;
}

export interface SunatDni {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
}

@Injectable()
export class TrabajadoresCentralizadoService {
  constructor(private readonly http: CentralizadoHttpClient) {}

  async createTrabajador(
    payload: CreateTrabajadorPayload,
    bearerToken: string,
  ): Promise<CreateTrabajadorResult> {
    const env = await this.http.post<
      CreateTrabajadorPayload,
      CentralizadoEnvelope<CreateTrabajadorResult>
    >('/trabajadores', payload, { bearerToken });
    return env.data;
  }

  async getTrabajador(
    usuarioUuid: string,
    bearerToken: string,
  ): Promise<TrabajadorDetalle> {
    const env = await this.http.get<CentralizadoEnvelope<TrabajadorDetalle>>(
      `/trabajadores/${usuarioUuid}`,
      { bearerToken },
    );
    return env.data;
  }

  async getTiposDocumento(): Promise<TipoDocumento[]> {
    const env = await this.http.get<CentralizadoEnvelope<TipoDocumento[]>>(
      '/query/tipos-documento',
    );
    return env.data;
  }

  async searchDni(documento: string): Promise<SunatDni> {
    const env = await this.http.get<CentralizadoEnvelope<SunatDni>>(
      `/query/dni/sunat?document=${encodeURIComponent(documento)}`,
    );
    return env.data;
  }
}
