import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../repository/task-assignment-repository.interface';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';
import { CreateTaskUseCase } from './create-task.use-case';
import { TaskEntity } from '../entities/task.entity';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ImportTasksDto } from '../dtos/import-tasks.dto';
import { ImportPreviewDto } from '../dtos/response/import-preview.dto';
import { ImportResultDto } from '../dtos/response/import-result.dto';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import {
  canAccessProjectActivities,
  isProjectResponsible,
} from '../../projects/lib/project-access';
import {
  ImportRowError,
  ParsedActivityRow,
  parseActivitiesWorkbook,
  resolveHierarchy,
} from '../lib/import-activities.parser';
import {
  CurrentTaskSnapshot,
  ImportRowPlan,
  ImportRowWarning,
  filterDuplicateIds,
  planImportRows,
} from '../lib/import-diff';
import {
  ResponsibleResolver,
  ResponsibleUser,
  buildResponsibleLabels,
  buildResponsibleResolver,
  fullName,
} from '../lib/import-responsibles';
import { buildImportTemplateBuffer } from '../lib/import-template';

interface ImportAnalysis {
  plans: ImportRowPlan[];
  nivelesEfectivos: number[];
  taskById: Map<number, TaskEntity>;
  byRow: Map<number, string[]>;
  errors: ImportRowError[];
  warnings: ImportRowWarning[];
  ignoradas: number;
}

@Injectable()
export class ImportTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
    @Inject(TASK_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: ITaskAssignmentRepository,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async preview(
    dto: ImportTasksDto,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<ImportPreviewDto> {
    const analysis = await this.analyze(dto, file, user);
    return ImportPreviewDto.from({
      plans: analysis.plans,
      nivelesEfectivos: analysis.nivelesEfectivos,
      ignoradas: analysis.ignoradas,
      errores: analysis.errors,
      avisos: analysis.warnings,
      filasConError: new Set(
        analysis.errors
          .map((error) => error.numeroFila)
          .filter((numeroFila) => numeroFila > 0),
      ),
    });
  }

  async execute(
    dto: ImportTasksDto,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<ImportResultDto> {
    const analysis = await this.analyze(dto, file, user);
    if (analysis.errors.length > 0) {
      throw new BadRequestException(this.formatErrors(analysis.errors));
    }
    if (analysis.plans.length === 0) {
      throw new BadRequestException('El archivo no contiene actividades');
    }

    return this.dataSource.transaction(async (em) => {
      const resolvedIds: (number | null)[] = Array.from(
        { length: analysis.plans.length },
        () => null,
      );
      const tasks: TaskEntity[] = [];
      let creadas = 0;
      let actualizadas = 0;
      let omitidas = 0;

      for (let index = 0; index < analysis.plans.length; index++) {
        const plan = analysis.plans[index];
        const row = plan.row;
        const parentTaskId =
          plan.parentIndex === null
            ? (dto.parent_task_id ?? null)
            : (resolvedIds[plan.parentIndex] ?? null);

        if (plan.action === 'omitir') {
          resolvedIds[index] = plan.existingTask?.id_task ?? null;
          omitidas++;
          continue;
        }

        const responsibleIds = analysis.byRow.get(row.numeroFila) ?? [];

        if (plan.action === 'crear') {
          const task = await this.createTaskUseCase.execute(
            {
              task_name: row.task_name,
              task_description: row.task_description,
              project_id: dto.project_id,
              parent_task_id: parentTaskId ?? undefined,
              start_date: row.start_date,
              due_date: row.due_date,
              status: row.estado,
            },
            user.sub,
            em,
            // Si la fila define responsables, estos reemplazan al que importa.
            { assignCreator: responsibleIds.length === 0 },
          );

          for (const responsibleId of responsibleIds) {
            await this.assignmentRepo.create(
              { task_id: task.id_task, user_id: responsibleId },
              em,
            );
          }

          resolvedIds[index] = task.id_task;
          tasks.push(task);
          creadas++;
          continue;
        }

        const existingId = plan.existingTask?.id_task;
        const existing =
          existingId != null ? analysis.taskById.get(existingId) : undefined;
        if (!existing) {
          throw new NotFoundException(
            `La tarea con ID ${existingId} ya no existe`,
          );
        }

        const partial = this.buildUpdatePartial(row, parentTaskId);
        if (
          plan.changes.includes('status') ||
          plan.changes.includes('parent')
        ) {
          partial.position =
            (await this.taskRepo.getMaxPosition(
              {
                projectId: dto.project_id,
                status: row.estado,
                parentTaskId,
              },
              em,
            )) + 1000;
        }

        await this.taskRepo.update(existing.id_task, partial, em);
        Object.assign(existing, partial);

        if (plan.changes.includes('responsibles')) {
          await this.assignmentRepo.replaceForTask(
            existing.id_task,
            responsibleIds,
            em,
          );
          // Refleja el estado nuevo en la respuesta sin una recarga extra.
          existing.assignments = responsibleIds.map(
            (user_id) =>
              ({ task_id: existing.id_task, user_id }) as TaskAssignmentEntity,
          );
        }

        resolvedIds[index] = existing.id_task;
        tasks.push(existing);
        actualizadas++;
      }

      return ImportResultDto.from({
        creadas,
        actualizadas,
        omitidas,
        tareas: tasks,
      });
    });
  }

  /** Plantilla de importación con la lista de responsables para el desplegable. */
  async getTemplate(): Promise<Buffer> {
    const users = await this.loadUsers();
    const labels = buildResponsibleLabels(users);
    const activeNames = users
      .filter((user) => user.estado !== false)
      .map((user) => labels.get(user.id_user))
      .filter((name): name is string => Boolean(name));

    return buildImportTemplateBuffer(
      [...new Set(activeNames)].sort((a, b) => a.localeCompare(b, 'es')),
    );
  }

  private async analyze(
    dto: ImportTasksDto,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<ImportAnalysis> {
    await this.validateTarget(dto, user);

    const parsed = await parseActivitiesWorkbook(
      file.buffer,
      file.originalname,
    );
    const dedup = filterDuplicateIds(parsed.filas);
    const { parentIndexes, nivelesEfectivos } = resolveHierarchy(dedup.rows);

    const [tasks, users] = await Promise.all([
      this.taskRepo.findByProjectWithAssignments(dto.project_id),
      this.loadUsers(),
    ]);
    const labels = buildResponsibleLabels(users);
    const snapshots = this.toSnapshots(tasks, labels);

    const planned = planImportRows(
      dedup.rows,
      parentIndexes,
      snapshots,
      dto.parent_task_id ?? null,
    );
    const resolver = buildResponsibleResolver(users);
    const { byRow, errors: responsibleErrors } = this.resolveResponsibles(
      planned.plans,
      resolver,
    );

    return {
      plans: planned.plans,
      nivelesEfectivos,
      taskById: new Map(tasks.map((task) => [task.id_task, task])),
      byRow,
      errors: [...parsed.errores, ...dedup.errors, ...responsibleErrors],
      warnings: planned.warnings,
      ignoradas: parsed.ignoradas,
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

  private toSnapshots(
    tasks: TaskEntity[],
    labels: Map<string, string>,
  ): Map<number, CurrentTaskSnapshot> {
    const projectTaskIds = new Set(tasks.map((task) => task.id_task));
    const snapshots = new Map<number, CurrentTaskSnapshot>();

    for (const task of tasks) {
      snapshots.set(task.id_task, {
        id_task: task.id_task,
        task_name: task.task_name,
        task_description: task.task_description ?? null,
        status: task.status,
        start_date: task.start_date ?? null,
        due_date: task.due_date ?? null,
        // Un padre fuera del proyecto se trata como raíz, igual que el export.
        parent_task_id:
          task.parent_task_id != null && projectTaskIds.has(task.parent_task_id)
            ? task.parent_task_id
            : null,
        responsibleNames: (task.assignments ?? [])
          .map(
            (assignment) =>
              labels.get(assignment.user_id) ??
              (assignment.user ? fullName(assignment.user) : ''),
          )
          .filter(Boolean),
      });
    }

    return snapshots;
  }

  /** Resuelve responsables solo en filas que se van a crear o actualizar. */
  private resolveResponsibles(
    plans: ImportRowPlan[],
    resolver: ResponsibleResolver,
  ): { byRow: Map<number, string[]>; errors: ImportRowError[] } {
    const byRow = new Map<number, string[]>();
    const errors: ImportRowError[] = [];

    for (const plan of plans) {
      if (!plan.needsResponsibleResolution) continue;
      const tokens = plan.row.responsables ?? [];
      if (tokens.length === 0) continue;

      const { ids, errors: resolveErrors } = resolver.resolve(
        tokens.join(', '),
      );
      if (resolveErrors.length > 0) {
        errors.push({
          numeroFila: plan.row.numeroFila,
          mensaje: resolveErrors.join('. '),
        });
      } else {
        byRow.set(plan.row.numeroFila, ids);
      }
    }

    return { byRow, errors };
  }

  private buildUpdatePartial(
    row: ParsedActivityRow,
    parentTaskId: number | null,
  ): Partial<TaskEntity> {
    const partial: Partial<TaskEntity> = {
      task_name: row.task_name,
      // TaskEntity tipa parent_task_id como number, pero la columna es nullable.
      parent_task_id: parentTaskId as number,
      status: row.estado,
    };

    if (row.task_description !== undefined) {
      partial.task_description = row.task_description;
    }
    if (row.start_date !== undefined) {
      partial.start_date = new Date(`${row.start_date}T00:00:00.000Z`);
    }
    if (row.due_date !== undefined) {
      partial.due_date = new Date(`${row.due_date}T00:00:00.000Z`);
    }

    return partial;
  }

  private formatErrors(errores: ImportRowError[]): string[] {
    return errores.map((error) =>
      error.numeroFila > 0
        ? `Fila ${error.numeroFila}: ${error.mensaje}`
        : error.mensaje,
    );
  }

  private async validateTarget(
    dto: ImportTasksDto,
    user: JwtPayload,
  ): Promise<void> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id_project: dto.project_id },
      select: { id_project: true, manager_id: true },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const isResponsible = await isProjectResponsible(
      this.dataSource,
      dto.project_id,
      user.sub,
    );
    if (!canAccessProjectActivities(project, user, isResponsible)) {
      throw new ForbiddenException(
        'No tienes permiso para importar en este proyecto',
      );
    }

    if (dto.parent_task_id === undefined) return;
    const parent = await this.taskRepo.findOneById(dto.parent_task_id);
    if (!parent) {
      throw new NotFoundException('Tarea padre no encontrada');
    }
    if (parent.project_id !== dto.project_id) {
      throw new BadRequestException('La tarea padre pertenece a otro proyecto');
    }
  }
}
