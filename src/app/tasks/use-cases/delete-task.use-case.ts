import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const task = await this.taskRepo.findOneById(id);
    if (!task) {
      throw new NotFoundException('Tarea con ID ' + id + ' no encontrada');
    }
    await this.taskRepo.delete(task);
  }
}
