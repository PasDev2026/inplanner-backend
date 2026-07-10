import { Injectable, Inject } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../repository/task-assignment-repository.interface';
import { TaskEntity } from '../entities/task.entity';
import { CreateTaskDto } from '../dtos/create-task.dto';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
    @Inject(TASK_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: ITaskAssignmentRepository,
  ) {}

  async execute(dto: CreateTaskDto, createdById: number): Promise<TaskEntity> {
    const task = new TaskEntity();
    Object.assign(task, dto, {
      created_by_id: createdById,
      status: dto.status ?? 0,
      start_date: dto.start_date ? new Date(dto.start_date) : new Date(),
    });
    const saved = await this.taskRepo.save(task);

    await this.assignmentRepo.create({
      task_id: saved.id_task,
      user_id: createdById,
    });

    return saved;
  }
}
