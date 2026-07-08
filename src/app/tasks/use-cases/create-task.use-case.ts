import { Injectable, Inject } from '@nestjs/common';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { TASK_REPOSITORY } from '../repository/task-repository.interface';
import { TaskEntity } from '../entities/task.entity';
import { CreateTaskDto } from '../dtos/create-task.dto';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(dto: CreateTaskDto, createdById: number): Promise<TaskEntity> {
    const task = new TaskEntity();
    Object.assign(task, dto, { created_by_id: createdById, status: dto.status ?? 0 });
    return this.taskRepo.save(task);
  }
}
