import type { UserEntity } from '../../users/entities/user.entity';

/**
 * Vista "segura" de un usuario para el MCP: solo datos laborales.
 * Se omiten a propósito datos personales (email, teléfono, documento,
 * persona_uuid) para cumplir con la decisión de no exponer PII.
 */
export interface SafeUser {
  id_user: string;
  name: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  area: { id_area: number; nombre_area: string } | null;
  estado: boolean;
}

/** Mapea una entidad de usuario a su vista sin datos personales. */
export function toSafeUser(user: UserEntity): SafeUser {
  return {
    id_user: user.id_user,
    name: user.name,
    apellido_paterno: user.apellido_paterno ?? null,
    apellido_materno: user.apellido_materno ?? null,
    area: user.area
      ? { id_area: user.area.id_area, nombre_area: user.area.nombre_area }
      : null,
    estado: user.estado,
  };
}
