import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class FindTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(id: number): Promise<TaskEntity> {
    const task = await this.taskRepo.findOneById(id);
    if (!task) {
      throw new NotFoundException('Tarea con ID ' + id + ' no encontrada');
    }
    return task;
  }
}
