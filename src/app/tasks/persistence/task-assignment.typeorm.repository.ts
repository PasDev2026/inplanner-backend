import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { CreateTaskAssignmentDto } from '../dtos/create-task-assignment.dto';
import type { ITaskAssignmentRepository } from '../repository/task-assignment-repository.interface';

@Injectable()
export class TaskAssignmentTypeormRepository implements ITaskAssignmentRepository {
  constructor(
    @InjectRepository(TaskAssignmentEntity)
    private readonly repo: Repository<TaskAssignmentEntity>,
  ) {}

  async findOneByTaskAndUser(
    taskId: number,
    userId: string,
  ): Promise<TaskAssignmentEntity | null> {
    return this.repo.findOne({
      where: { task_id: taskId, user_id: userId },
    });
  }

  async create(dto: CreateTaskAssignmentDto): Promise<TaskAssignmentEntity> {
    const assignment = this.repo.create(dto);
    return this.repo.save(assignment);
  }

  async findByTaskId(taskId: number): Promise<TaskAssignmentEntity[]> {
    return this.repo.find({
      where: { task_id: taskId },
      relations: { user: true },
    });
  }

  async delete(assignment: TaskAssignmentEntity): Promise<void> {
    await this.repo.remove(assignment);
  }
}
