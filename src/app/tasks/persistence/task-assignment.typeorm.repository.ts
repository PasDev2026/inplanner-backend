import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  async create(
    dto: CreateTaskAssignmentDto,
    manager?: EntityManager,
  ): Promise<TaskAssignmentEntity> {
    const repo = manager
      ? manager.getRepository(TaskAssignmentEntity)
      : this.repo;
    const assignment = repo.create(dto);
    return repo.save(assignment);
  }

  async findByTaskId(taskId: number): Promise<TaskAssignmentEntity[]> {
    return this.repo.find({
      where: { task_id: taskId },
      relations: { user: true },
    });
  }

  async replaceForTask(
    taskId: number,
    userIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(TaskAssignmentEntity)
      : this.repo;
    await repo.delete({ task_id: taskId });

    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return;
    await repo.save(
      uniqueIds.map((user_id) => repo.create({ task_id: taskId, user_id })),
    );
  }

  async delete(assignment: TaskAssignmentEntity): Promise<void> {
    await this.repo.remove(assignment);
  }
}
