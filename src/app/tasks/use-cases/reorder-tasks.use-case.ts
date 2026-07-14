import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import { TaskEntity } from '../entities/task.entity';
import { ReorderTaskDto } from '../dtos/reorder-tasks.dto';

@Injectable()
export class ReorderTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(dto: ReorderTaskDto): Promise<void> {
    const task = await this.taskRepo.findOneById(dto.taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');

    const status = dto.targetStatus ?? task.status ?? 0;
    const siblings = await this.taskRepo.findSiblings({
      projectId: task.project_id,
      status,
      parentTaskId: task.parent_task_id,
    });

    const ordered = siblings
      .filter((s) => s.id_task !== dto.taskId)
      .sort((a, b) => a.position - b.position);

    const targetIndex = Math.min(
      Math.max(0, Math.round(dto.position)),
      ordered.length,
    );

    let newPosition: number;
    if (ordered.length === 0) {
      newPosition = 1000;
    } else if (targetIndex === 0) {
      newPosition = ordered[0].position / 2;
    } else if (targetIndex >= ordered.length) {
      newPosition = ordered[ordered.length - 1].position + 1000;
    } else {
      newPosition =
        (ordered[targetIndex - 1].position + ordered[targetIndex].position) / 2;
    }

    if (this.shouldReindex(newPosition, ordered, targetIndex)) {
      await this.reindexColumn(
        task.project_id,
        status,
        task.parent_task_id ?? null,
      );
      return this.execute(dto);
    }

    if (dto.targetStatus != null && dto.targetStatus !== task.status) {
      await this.taskRepo.update(dto.taskId, { status: dto.targetStatus });
    }

    await this.taskRepo.updatePosition(dto.taskId, newPosition);
  }

  private shouldReindex(
    position: number,
    siblings: TaskEntity[],
    index: number,
  ): boolean {
    const gap =
      index === 0
        ? position
        : index >= siblings.length
          ? siblings[siblings.length - 1].position -
            (siblings[siblings.length - 2]?.position ?? 0)
          : siblings[index].position - siblings[index - 1].position;
    return Math.abs(gap) < 0.001;
  }

  private async reindexColumn(
    projectId: number,
    status: number,
    parentTaskId: number | null,
  ): Promise<void> {
    const siblings = await this.taskRepo.findSiblings({
      projectId,
      status,
      parentTaskId,
    });
    const ordered = siblings.sort((a, b) => a.position - b.position);
    for (let i = 0; i < ordered.length; i++) {
      await this.taskRepo.updatePosition(ordered[i].id_task, (i + 1) * 1000);
    }
  }
}
