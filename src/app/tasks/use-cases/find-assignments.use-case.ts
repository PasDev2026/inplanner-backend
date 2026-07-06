import { Injectable, Inject } from '@nestjs/common';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../repository/task-assignment-repository.interface';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';

@Injectable()
export class FindAssignmentsUseCase {
  constructor(
    @Inject(TASK_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: ITaskAssignmentRepository,
  ) {}

  async execute(taskId: number): Promise<TaskAssignmentEntity[]> {
    return this.assignmentRepo.findByTaskId(taskId);
  }
}
