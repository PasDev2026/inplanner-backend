export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  idUser: number;
  username: string;
  email: string;
  name: string;
  apellido_paterno: string;
  dni: string;
  fullName: string;
  roles: string[];
  sedesIds: number[];
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}
