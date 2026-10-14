import {
  BadRequestException,
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
import { ProjectEntity } from '../../projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ImportTasksDto } from '../dtos/import-tasks.dto';
import { ImportPreviewDto } from '../dtos/response/import-preview.dto';
import {
  ImportRowError,
  ParseActivitiesResult,
  ParsedActivityRow,
  parseActivitiesWorkbook,
  resolveHierarchy,
} from '../lib/import-activities.parser';
import {
  ResponsibleResolver,
  buildResponsibleResolver,
  listResponsibleNames,
} from '../lib/import-responsibles';
import { buildImportTemplateBuffer } from '../lib/import-template';

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
  ): Promise<ImportPreviewDto> {
    await this.validateTarget(dto);
    const result = await parseActivitiesWorkbook(
      file.buffer,
      file.originalname,
    );
    await this.applyResponsibleResolution(result);
    const { nivelesEfectivos } = resolveHierarchy(result.filas);
    return ImportPreviewDto.from(result, nivelesEfectivos);
  }

  async execute(
    dto: ImportTasksDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<TaskEntity[]> {
    await this.validateTarget(dto);

    const result = await parseActivitiesWorkbook(
      file.buffer,
      file.originalname,
    );
    if (result.errores.length > 0) {
      throw new BadRequestException(this.formatErrors(result.errores));
    }

    const resolver = await this.buildResolver();
    const { byRow, errores } = this.resolveResponsibles(result.filas, resolver);
    if (errores.length > 0) {
      throw new BadRequestException(this.formatErrors(errores));
    }

    if (result.filas.length === 0) {
      throw new BadRequestException('El archivo no contiene actividades');
    }

    const { parentIndexes } = resolveHierarchy(result.filas);

    return this.dataSource.transaction(async (em) => {
      const created: TaskEntity[] = [];
      const idByIndex = new Map<number, number>();

      for (let index = 0; index < result.filas.length; index++) {
        const fila = result.filas[index];
        const parentIndex = parentIndexes[index];
        const parentTaskId =
          parentIndex === null
            ? dto.parent_task_id
            : idByIndex.get(parentIndex);
        const responsibleIds = byRow.get(fila.numeroFila) ?? [];

        const task = await this.createTaskUseCase.execute(
          {
            task_name: fila.task_name,
            task_description: fila.task_description,
            project_id: dto.project_id,
            parent_task_id: parentTaskId,
            start_date: fila.start_date,
            due_date: fila.due_date,
            status: fila.estado,
          },
          userId,
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

        idByIndex.set(index, task.id_task);
        created.push(task);
      }

      return created;
    });
  }

  /** Carga los usuarios activos y construye el resolver de responsables. */
  private async buildResolver(): Promise<ResponsibleResolver> {
    const users = await this.dataSource.getRepository(UserEntity).find({
      where: { estado: true },
      select: {
        id_user: true,
        name: true,
        apellido_paterno: true,
        apellido_materno: true,
      },
    });
    return buildResponsibleResolver(users);
  }

  /** Plantilla de importación con la lista de responsables para el desplegable. */
  async getTemplate(): Promise<Buffer> {
    const users = await this.dataSource.getRepository(UserEntity).find({
      where: { estado: true },
      select: {
        id_user: true,
        name: true,
        apellido_paterno: true,
        apellido_materno: true,
      },
    });
    return buildImportTemplateBuffer(listResponsibleNames(users));
  }

  /** Resuelve los responsables de cada fila. Devuelve ids por fila y errores. */
  private resolveResponsibles(
    filas: ParsedActivityRow[],
    resolver: ResponsibleResolver,
  ): { byRow: Map<number, string[]>; errores: ImportRowError[] } {
    const byRow = new Map<number, string[]>();
    const errores: ImportRowError[] = [];

    for (const fila of filas) {
      if (!fila.responsables || fila.responsables.length === 0) continue;
      const { ids, errors } = resolver.resolve(fila.responsables.join(', '));
      if (errors.length > 0) {
        errores.push({
          numeroFila: fila.numeroFila,
          mensaje: errors.join('. '),
        });
      } else {
        byRow.set(fila.numeroFila, ids);
      }
    }

    return { byRow, errores };
  }

  /**
   * Para la vista previa: resuelve responsables y descarta las filas con
   * errores, para que la jerarquía se calcule solo con filas válidas.
   */
  private async applyResponsibleResolution(
    result: ParseActivitiesResult,
  ): Promise<void> {
    const resolver = await this.buildResolver();
    const { errores } = this.resolveResponsibles(result.filas, resolver);
    if (errores.length === 0) return;

    const badRows = new Set(errores.map((error) => error.numeroFila));
    result.filas = result.filas.filter((fila) => !badRows.has(fila.numeroFila));
    result.errores.push(...errores);
  }

  private formatErrors(errores: ImportRowError[]): string[] {
    return errores.map((error) =>
      error.numeroFila > 0
        ? `Fila ${error.numeroFila}: ${error.mensaje}`
        : error.mensaje,
    );
  }

  private async validateTarget(dto: ImportTasksDto): Promise<void> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id_project: dto.project_id },
      select: { id_project: true },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
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
