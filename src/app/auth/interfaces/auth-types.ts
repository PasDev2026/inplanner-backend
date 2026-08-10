export interface UserSede {
  sede_id: string;
  sede_nombre: string;
  sede_slug: string;
  rol_codigo: string;
}

export interface JwtPayload {
  sub: string;
  persona_id: string;
  numero_documento: string;
  nombres: string;
  apellido_paterno: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  tipo: 'TRABAJADOR' | 'PACIENTE';
  pais_codigo: string;
  sede_activa: UserSede;
  otras_sedes: UserSede[];
  iat?: number;
  exp?: number;
}

export interface UsuarioResponse {
  id: string;
  numero_documento?: string;
  nombre_completo: string;
  nombres: string;
  apellido_paterno: string;
  email: string | null;
  pais_codigo: string;
  sede_activa: UserSede;
  otras_sedes: UserSede[];
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  usuario: UsuarioResponse;
}

export interface CentralizadoEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export type LoginResponse = TokenData;
export type RefreshResponse = TokenData;
