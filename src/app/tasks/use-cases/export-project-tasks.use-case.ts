import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';
import type { TaskEntity } from '../entities/task.entity';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import { isSuperAdmin } from '../../../common/helpers/user-auth.helper';
import {
  ResponsibleUser,
  buildResponsibleLabels,
} from '../lib/import-responsibles';
import { buildProjectExportBuffer } from '../lib/import-template';
import { buildProjectExportRows } from '../lib/project-export';

export interface ProjectTasksExport {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class ExportProjectTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    projectId: number,
    user: JwtPayload,
  ): Promise<ProjectTasksExport> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id_project: projectId },
      select: { id_project: true, name_project: true, manager_id: true },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (!isSuperAdmin(user) && project.manager_id !== user.sub) {
      throw new ForbiddenException(
        'No tienes permiso para exportar este proyecto',
      );
    }

    const [tasks, users] = await Promise.all([
      this.taskRepo.findByProjectWithAssignments(projectId),
      this.loadUsers(),
    ]);

    const labels = buildResponsibleLabels(users);
    const rows = buildProjectExportRows(tasks, labels);
    const responsibleNames = this.collectResponsibleNames(users, labels, tasks);
    const buffer = await buildProjectExportBuffer(rows, responsibleNames);

    return {
      buffer,
      filename: buildExportFilename(project.name_project, projectId),
    };
  }

  private async loadUsers(): Promise<ResponsibleUser[]> {
    return this.dataSource.getRepository(UserEntity).find({
      select: {
        id_user: true,
        name: true,
        apellido_paterno: true,
        apellido_materno: true,
        numero_documento: true,
        email: true,
        estado: true,
      },
    });
  }

  /**
   * Nombres para el desplegable: usuarios activos + responsables asignados
   * (aunque estén inactivos), con la misma etiqueta usada en las filas.
   */
  private collectResponsibleNames(
    users: ResponsibleUser[],
    labels: Map<string, string>,
    tasks: TaskEntity[],
  ): string[] {
    const names = new Set<string>();

    for (const user of users) {
      if (user.estado === false) continue;
      const label = labels.get(user.id_user);
      if (label) names.add(label);
    }

    for (const task of tasks) {
      for (const assignment of task.assignments ?? []) {
        const label = labels.get(assignment.user_id);
        if (label) names.add(label);
      }
    }

    return [...names].sort((a, b) => a.localeCompare(b, 'es'));
  }
}

function buildExportFilename(projectName: string, projectId: number): string {
  const safeName = String(projectName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return `Actividades_${safeName || `Proyecto_${projectId}`}.xlsx`;
}
