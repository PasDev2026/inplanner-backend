import type {
  JwtPayload,
  UserSede,
} from '../../app/auth/interfaces/auth-types';

// Sedes del usuario = union de la sede activa + otras sedes del token
// (equivale a la antigua lista user.roles con todas sus sedes).
export function userSedes(user: JwtPayload): UserSede[] {
  return [user.sede_activa, ...(user.otras_sedes ?? [])].filter(
    (s): s is UserSede => !!s?.sede_id,
  );
}

export function isSuperAdmin(user: JwtPayload): boolean {
  return userSedes(user).some((s) => s.rol_codigo === 'SUPER_ADMINISTRADOR');
}

export function userSedeIds(user: JwtPayload): string[] {
  return userSedes(user).map((s) => s.sede_id);
}
