import { UserRoleEntity } from '../../users/entities/user-role.entity';
import { Role } from '../../../common/enums/role.enum';

const ROLE_MAP: Record<number, Role> = {
  15: Role.SUPER_ADMIN,
  5: Role.JEFATURA,
  6: Role.PERSONAL,
};

export function resolveRoles(userRoles: UserRoleEntity[]): string[] {
  if (!userRoles || userRoles.length === 0) return [];
  return userRoles
    .map((ur) => ROLE_MAP[ur.rol_id])
    .filter((role): role is Role => role !== undefined)
    .map((role) => role as string);
}

export function buildFullName(user: {
  name: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
}): string {
  return `${user.name} ${user.apellido_paterno ?? ''} ${user.apellido_materno ?? ''}`.trim();
}
