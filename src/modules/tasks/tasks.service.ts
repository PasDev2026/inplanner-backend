import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { TaskAssignmentEntity } from './task-assignment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskAssignmentEntity)
    private readonly assignmentRepository: Repository<TaskAssignmentEntity>,
  ) {}

  async create(dto: CreateTaskDto, createdById: number): Promise<TaskEntity> {
    const task = this.taskRepository.create({
      ...dto,
      created_by_id: createdById,
    } as any) as unknown as TaskEntity;
    return this.taskRepository.save(task);
  }

  async findAll(query: QueryTaskDto): Promise<PaginatedResult<TaskEntity>> {
    const { page = 1, limit = 20, search, project_id, status, priority } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<TaskEntity> = {};

    if (search) {
      where.task_name = ILike(`%${search}%`);
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

    const [data, total] = await this.taskRepository.findAndCount({
      where,
      relations: { assignments: { user: true } },
      skip,
      take: limit,
      order: { id_task: 'ASC' },
    });

    if (data.length > 0) {
      await this._attachSubtasksCount(data);
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

  async findOne(id: number): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({
      where: { id_task: id },
      relations: {
        assignments: { user: true },
        createdBy: true,
        notes: { createdBy: true },
      },
    });

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    (task as any).subtasks_count = await this.taskRepository.count({
      where: { parent_task_id: id },
    });

    return task;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskEntity> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async createAssignment(dto: CreateTaskAssignmentDto): Promise<TaskAssignmentEntity> {
    const existing = await this.assignmentRepository.findOne({
      where: { task_id: dto.task_id, user_id: dto.user_id },
    });

    if (existing) {
      throw new ConflictException('El usuario ya está asignado a esta tarea');
    }

    const assignment = this.assignmentRepository.create(dto);
    return this.assignmentRepository.save(assignment);
  }

  async findAssignments(taskId: number): Promise<TaskAssignmentEntity[]> {
    return this.assignmentRepository.find({
      where: { task_id: taskId },
      relations: { user: true },
    });
  }

  async removeAssignment(taskId: number, userId: number): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { task_id: taskId, user_id: userId },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    await this.assignmentRepository.remove(assignment);
  }

  async findChildren(taskId: number): Promise<TaskEntity[]> {
    const children = await this.taskRepository.find({
      where: { parent_task_id: taskId },
      relations: { assignments: { user: true } },
      order: { id_task: 'ASC' },
    });

    if (children.length > 0) {
      await this._attachSubtasksCount(children);
    }

    return children;
  }

  private async _attachSubtasksCount(tasks: TaskEntity[]): Promise<void> {
    const ids = tasks.map(t => t.id_task);
    if (ids.length === 0) return;

    const counts = await this.taskRepository
      .createQueryBuilder('child')
      .select('child.parent_task_id', 'parent_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('child.parent_task_id IN (:...ids)', { ids })
      .groupBy('child.parent_task_id')
      .getRawMany() as { parent_id: number; cnt: string }[];

    const countMap = new Map<number, number>(
      counts.map(c => [c.parent_id, Number(c.cnt)]),
    );

    for (const task of tasks) {
      (task as any).subtasks_count = countMap.get(task.id_task) ?? 0;
    }
  }

  async updateStatus(id: number, dto: UpdateTaskStatusDto): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({ where: { id_task: id } });
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }
}
