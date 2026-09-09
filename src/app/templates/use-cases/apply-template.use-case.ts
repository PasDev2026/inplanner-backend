import { DataSource, EntityManager } from 'typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { ApplyTemplateDto } from '../dtos/apply-template.dto';
import { TASK_REPOSITORY } from '../../tasks/repository/task-repository.interface';
import type { ITaskRepository } from '../../tasks/repository/task-repository.interface';
import { CreateTaskUseCase } from '../../tasks/use-cases/create-task.use-case';
import { TaskEntity } from '../../tasks/entities/task.entity';
import { TemplateItemEntity } from '../entities/template-item.entity';

@Injectable()
export class ApplyTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    templateId: number,
    dto: ApplyTemplateDto,
    userId: string,
    opts?: { isAdmin?: boolean },
  ): Promise<TaskEntity[]> {
    const template = await this.templateRepo.findOneById(templateId);
    if (!template || (!opts?.isAdmin && template.owner_id !== userId)) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    if (dto.parent_task_id) {
      const parent = await this.taskRepo.findOneById(dto.parent_task_id);
      if (!parent) {
        throw new NotFoundException('Tarea padre no encontrada');
      }
      if (parent.project_id !== dto.project_id) {
        throw new BadRequestException(
          'La tarea padre pertenece a otro proyecto',
        );
      }
    }

    return this.dataSource.transaction(async (em) =>
      this.createItems(em, template.items ?? [], dto, userId, null),
    );
  }

  private async createItems(
    em: EntityManager,
    items: TemplateItemEntity[],
    dto: ApplyTemplateDto,
    userId: string,
    parentTaskId: number | null,
  ): Promise<TaskEntity[]> {
    const created: TaskEntity[] = [];
    for (const item of items) {
      const task = await this.createTaskUseCase.execute(
        {
          task_name: item.item_name,
          task_description: item.item_description ?? undefined,
          project_id: dto.project_id,
          parent_task_id: parentTaskId ?? dto.parent_task_id,
          priority: item.priority ?? undefined,
        },
        userId,
        em,
      );
      const children = await this.createItems(
        em,
        item.children ?? [],
        dto,
        userId,
        task.id_task,
      );
      created.push(task, ...children);
    }
    return created;
  }
}
