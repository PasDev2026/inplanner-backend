import { InjectionToken } from '@nestjs/common';
import { TaskEntity } from '../entities/task.entity';
import { QueryTaskDto } from '../dtos/query-task.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

export const TASK_REPOSITORY = 'TASK_REPOSITORY' as InjectionToken;

export interface ITaskRepository {
  save(task: TaskEntity): Promise<TaskEntity>;
  findWithPagination(query: QueryTaskDto): Promise<PaginatedResult<TaskEntity>>;
  findOneById(id: number): Promise<TaskEntity | null>;
  update(id: number, partial: Partial<TaskEntity>): Promise<void>;
  delete(task: TaskEntity): Promise<void>;
  findChildren(parentId: number): Promise<TaskEntity[]>;
}
