import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../repository/task-assignment-repository.interface';

@Injectable()
export class RemoveAssignmentUseCase {
  constructor(
    @Inject(TASK_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: ITaskAssignmentRepository,
  ) {}

  async execute(taskId: number, userId: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOneByTaskAndUser(
      taskId,
      userId,
    );
    if (!assignment) {
      throw new NotFoundException('Asignaci\u00f3n no encontrada');
    }
    await this.assignmentRepo.delete(assignment);
  }
}
