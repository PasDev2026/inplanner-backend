import { Injectable, Inject } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class FindChildrenUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(parentId: number): Promise<TaskEntity[]> {
    return this.taskRepo.findChildren(parentId);
  }
}
