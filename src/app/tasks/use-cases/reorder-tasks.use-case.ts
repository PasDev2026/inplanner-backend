import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    const targetParentId =
      dto.parentTaskId !== undefined ? dto.parentTaskId : task.parent_task_id;
    const targetStatus = dto.targetStatus ?? task.status ?? 0;

    const parentChanged = targetParentId !== task.parent_task_id;
    const statusChanged =
      dto.targetStatus != null && dto.targetStatus !== task.status;

    if (parentChanged) {
      await this.validateTargetParent(task, targetParentId ?? null);
      await this.taskRepo.update(task.id_task, {
        parent_task_id: targetParentId ?? null,
      });
    }
    if (statusChanged) {
      await this.taskRepo.update(task.id_task, { status: targetStatus });
    }

    let statusFilter: number | undefined;
    if (dto.targetStatus !== undefined) {
      statusFilter = dto.targetStatus;
    } else if (dto.parentTaskId === undefined) {
      statusFilter = task.status ?? 0;
    }

    const siblings = await this.taskRepo.findSiblings({
      projectId: task.project_id,
      status: statusFilter,
      parentTaskId: targetParentId ?? null,
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
      await this.reindexGroup(
        task.project_id,
        statusFilter,
        targetParentId ?? null,
      );
      return this.execute(dto);
    }

    await this.taskRepo.updatePosition(dto.taskId, newPosition);
  }

  private async validateTargetParent(
    task: TaskEntity,
    targetParentId: number | null,
  ): Promise<void> {
    if (targetParentId === null) return;

    let cursorId: number | null = targetParentId;
    while (cursorId != null) {
      if (cursorId === task.id_task) {
        throw new BadRequestException(
          'No se puede mover una tarea bajo sí misma o una de sus subtareas',
        );
      }
      const parent = await this.taskRepo.findOneById(cursorId);
      if (!parent) {
        throw new BadRequestException('Tarea padre no encontrada');
      }
      if (parent.project_id !== task.project_id) {
        throw new BadRequestException(
          'La tarea padre debe pertenecer al mismo proyecto',
        );
      }
      cursorId = parent.parent_task_id;
    }
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

  private async reindexGroup(
    projectId: number,
    status: number | undefined,
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
