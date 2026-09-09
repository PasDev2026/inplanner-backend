import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TemplateEntity } from '../entities/template.entity';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { CreateTemplateItemDto } from '../dtos/create-template-item.dto';
import { TASK_REPOSITORY } from '../../tasks/repository/task-repository.interface';
import type { ITaskRepository } from '../../tasks/repository/task-repository.interface';
import { TaskEntity } from '../../tasks/entities/task.entity';
import { TemplateResponseDto } from '../dtos/response/template-response.dto';

@Injectable()
export class CreateTemplateFromTaskUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(
    taskId: number,
    templateName: string,
    ownerId: string,
  ): Promise<TemplateResponseDto> {
    const task = await this.taskRepo.findOneById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const items = await this.toItems(task);
    const template = new TemplateEntity();
    template.template_name = templateName;
    template.owner_id = ownerId;

    const saved = await this.templateRepo.create(template, items);
    return TemplateResponseDto.fromEntity(saved, items.length, false);
  }

  private async toItems(task: TaskEntity): Promise<CreateTemplateItemDto[]> {
    const children = await this.taskRepo.findChildren(task.id_task);
    return [
      {
        item_name: task.task_name,
        item_description: task.task_description ?? undefined,
        position: task.position,
        priority: task.priority ?? undefined,
        children: (
          await Promise.all(
            children
              .sort((a, b) => a.position - b.position)
              .map((child) => this.toItems(child)),
          )
        ).flat(),
      },
    ];
  }
}
