import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../repository/task-assignment-repository.interface';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { CreateTaskAssignmentDto } from '../dtos/create-task-assignment.dto';

@Injectable()
export class CreateAssignmentUseCase {
  constructor(
    @Inject(TASK_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: ITaskAssignmentRepository,
  ) {}

  async execute(dto: CreateTaskAssignmentDto): Promise<TaskAssignmentEntity> {
    const existing = await this.assignmentRepo.findOneByTaskAndUser(
      dto.task_id!,
      dto.user_id,
    );
    if (existing) {
      throw new ConflictException(
        'El usuario ya est\u00e1 asignado a esta tarea',
      );
    }
    return this.assignmentRepo.create(dto);
  }
}
