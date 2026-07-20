export interface JwtPayload {
  sub: string;
  persona_id: string;
  numero_documento: string;
  nombres: string;
  apellido_paterno: string;
  roles: { sede_id: string; sede_nombre: string; rol_codigo: string }[];
  tipo: string;
  iat?: number;
  exp?: number;
}

export interface UsuarioResponse {
  id: string;
  numero_documento: string;
  nombre_completo: string;
  nombres: string;
  apellido_paterno: string;
  email: string | null;
  roles: { sedeId: string; sedeNombre: string; rolCodigo: string }[];
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
