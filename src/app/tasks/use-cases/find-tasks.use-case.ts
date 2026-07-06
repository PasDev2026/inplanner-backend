import { Injectable, Inject } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import { QueryTaskDto } from '../dtos/query-task.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class FindTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(query: QueryTaskDto): Promise<PaginatedResult<TaskEntity>> {
    return this.taskRepo.findWithPagination(query);
  }
}
