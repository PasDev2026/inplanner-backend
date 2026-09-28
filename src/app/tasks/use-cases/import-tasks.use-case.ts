import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { CreateTaskUseCase } from './create-task.use-case';
import { TaskEntity } from '../entities/task.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { ImportTasksDto } from '../dtos/import-tasks.dto';
import { ImportPreviewDto } from '../dtos/response/import-preview.dto';
import {
  parseActivitiesWorkbook,
  resolveHierarchy,
} from '../lib/import-activities.parser';

@Injectable()
export class ImportTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
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
      throw new BadRequestException(
        result.errores.map((error) =>
          error.numeroFila > 0
            ? `Fila ${error.numeroFila}: ${error.mensaje}`
            : error.mensaje,
        ),
      );
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

        const task = await this.createTaskUseCase.execute(
          {
            task_name: fila.task_name,
            task_description: fila.task_description,
            project_id: dto.project_id,
            parent_task_id: parentTaskId,
            status: fila.estado,
          },
          userId,
          em,
        );

        idByIndex.set(index, task.id_task);
        created.push(task);
      }

      return created;
    });
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
