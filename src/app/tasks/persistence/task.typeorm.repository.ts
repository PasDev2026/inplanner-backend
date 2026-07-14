import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import type { ITaskRepository } from '../repository/task-repository.interface';
import { QueryTaskDto } from '../dtos/query-task.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class TaskTypeormRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>,
  ) {}

  async save(task: TaskEntity): Promise<TaskEntity> {
    return this.repo.save(task);
  }

  async findWithPagination(
    query: QueryTaskDto,
  ): Promise<PaginatedResult<TaskEntity>> {
    const {
      page = 1,
      limit = 20,
      search,
      project_id,
      status,
      priority,
    } = query;
    const take = limit > 0 ? limit : undefined;
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const where: FindOptionsWhere<TaskEntity> = {};

    if (search) {
      where.task_name = ILike('%' + search + '%');
    }
    if (project_id !== undefined) {
      where.project_id = project_id;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (priority !== undefined) {
      where.priority = priority;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { assignments: { user: true }, notes: true },
      skip,
      take,
      order: { position: 'ASC' },
    });

    if (data.length > 0) {
      await this.attachSubtasksCount(data);
    }

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(id: number): Promise<TaskEntity | null> {
    const task = await this.repo.findOne({
      where: { id_task: id },
      relations: {
        assignments: { user: true },
        createdBy: true,
        notes: { createdBy: true },
      },
    });

    if (task) {
      task.subtasks_count = await this.repo.count({
        where: { parent_task_id: id },
      });
    }

    return task;
  }

  async update(id: number, partial: Partial<TaskEntity>): Promise<void> {
    await this.repo.update(id, partial);
  }

  async delete(task: TaskEntity): Promise<void> {
    await this.repo.remove(task);
  }

  async findChildren(parentId: number): Promise<TaskEntity[]> {
    const children = await this.repo.find({
      where: { parent_task_id: parentId },
      relations: { assignments: { user: true } },
      order: { position: 'ASC' },
    });

    if (children.length > 0) {
      await this.attachSubtasksCount(children);
    }

    return children;
  }

  async findSiblings(params: {
    projectId: number;
    status: number;
    parentTaskId: number | null;
  }): Promise<TaskEntity[]> {
    return this.repo.find({
      where: {
        project_id: params.projectId,
        status: params.status,
        parent_task_id: params.parentTaskId ?? IsNull(),
      },
      order: { position: 'ASC' },
    });
  }

  async updatePosition(id: number, position: number): Promise<void> {
    await this.repo.update(id, { position });
  }

  async getMaxPosition(params: {
    projectId: number;
    status: number;
    parentTaskId: number | null;
  }): Promise<number> {
    type MaxResult = { max: number | null };
    const result = await this.repo
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'max')
      .where('task.project_id = :projectId', { projectId: params.projectId })
      .andWhere('task.status = :status', { status: params.status })
      .andWhere(
        params.parentTaskId === null
          ? 'task.parent_task_id IS NULL'
          : 'task.parent_task_id = :parentTaskId',
        params.parentTaskId !== null
          ? { parentTaskId: params.parentTaskId }
          : {},
      )
      .getRawOne<MaxResult>();
    return result?.max ?? 0;
  }

  private async attachSubtasksCount(tasks: TaskEntity[]): Promise<void> {
    const ids = tasks.map((t) => t.id_task);
    if (ids.length === 0) return;

    type RawCount = { parent_id: number; cnt: string };
    const counts = await this.repo
      .createQueryBuilder('child')
      .select('child.parent_task_id', 'parent_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('child.parent_task_id IN (:...ids)', { ids })
      .groupBy('child.parent_task_id')
      .getRawMany<RawCount>();

    const countMap = new Map<number, number>(
      counts.map((c: RawCount) => [Number(c.parent_id), Number(c.cnt)]),
    );

    for (const task of tasks) {
      task.subtasks_count = countMap.get(task.id_task) ?? 0;
    }
  }
}
