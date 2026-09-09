import { InjectionToken } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { CreateTaskAssignmentDto } from '../dtos/create-task-assignment.dto';

export const TASK_ASSIGNMENT_REPOSITORY =
  'TASK_ASSIGNMENT_REPOSITORY' as InjectionToken;

export interface ITaskAssignmentRepository {
  findOneByTaskAndUser(
    taskId: number,
    userId: string,
  ): Promise<TaskAssignmentEntity | null>;
  create(
    dto: CreateTaskAssignmentDto,
    manager?: EntityManager,
  ): Promise<TaskAssignmentEntity>;
  findByTaskId(taskId: number): Promise<TaskAssignmentEntity[]>;
  delete(assignment: TaskAssignmentEntity): Promise<void>;
}
