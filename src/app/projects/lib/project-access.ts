import type { DataSource } from 'typeorm';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import { ProjectResponsibleEntity } from '../entities/project-responsible.entity';
import { isSuperAdmin } from '../../../common/helpers/user-auth.helper';

/**
 * Regla de acceso a las actividades de un proyecto:
 * manager, superadmin o usuario mencionado (project_responsibles).
 */
export function canAccessProjectActivities(
  project: { manager_id: string },
  user: JwtPayload,
  isResponsible: boolean,
): boolean {
  return isSuperAdmin(user) || project.manager_id === user.sub || isResponsible;
}

/** Indica si el usuario está registrado como responsable del proyecto. */
export async function isProjectResponsible(
  dataSource: DataSource,
  projectId: number,
  userId: string,
): Promise<boolean> {
  const responsible = await dataSource
    .getRepository(ProjectResponsibleEntity)
    .findOne({
      where: { project_id: projectId, user_id: userId },
      select: { project_id: true, user_id: true },
    });

  return responsible !== null;
}
