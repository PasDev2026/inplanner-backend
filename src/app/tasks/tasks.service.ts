import { Injectable } from '@nestjs/common';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { FindTasksUseCase } from './use-cases/find-tasks.use-case';
import { FindTaskUseCase } from './use-cases/find-task.use-case';
import { UpdateTaskUseCase } from './use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './use-cases/delete-task.use-case';
import { UpdateTaskStatusUseCase } from './use-cases/update-task-status.use-case';
import { CreateAssignmentUseCase } from './use-cases/create-assignment.use-case';
import { FindAssignmentsUseCase } from './use-cases/find-assignments.use-case';
import { RemoveAssignmentUseCase } from './use-cases/remove-assignment.use-case';
import { FindChildrenUseCase } from './use-cases/find-children.use-case';
import { ReorderTasksUseCase } from './use-cases/reorder-tasks.use-case';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { QueryTaskDto } from './dtos/query-task.dto';
import { CreateTaskAssignmentDto } from './dtos/create-task-assignment.dto';
import { UpdateTaskStatusDto } from './dtos/update-task-status.dto';
import { ReorderTaskDto } from './dtos/reorder-tasks.dto';
import { TaskResponseDto } from './dtos/response/task-response.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly findTasksUseCase: FindTasksUseCase,
    private readonly findTaskUseCase: FindTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly updateTaskStatusUseCase: UpdateTaskStatusUseCase,
    private readonly createAssignmentUseCase: CreateAssignmentUseCase,
    private readonly findAssignmentsUseCase: FindAssignmentsUseCase,
    private readonly removeAssignmentUseCase: RemoveAssignmentUseCase,
    private readonly findChildrenUseCase: FindChildrenUseCase,
    private readonly reorderTasksUseCase: ReorderTasksUseCase,
  ) {}

  async create(
    dto: CreateTaskDto,
    createdById: number,
  ): Promise<TaskResponseDto> {
    const task = await this.createTaskUseCase.execute(dto, createdById);
    return TaskResponseDto.fromEntity(task);
  }

  async findAll(
    query: QueryTaskDto,
  ): Promise<PaginatedResult<TaskResponseDto>> {
    const result = await this.findTasksUseCase.execute(query);
    return TaskResponseDto.fromPaginated(result);
  }

  async findOne(id: number): Promise<TaskResponseDto> {
    const task = await this.findTaskUseCase.execute(id);
    return TaskResponseDto.fromEntity(task);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.updateTaskUseCase.execute(id, dto);
    return TaskResponseDto.fromEntity(task);
  }

  async remove(id: number): Promise<void> {
    await this.deleteTaskUseCase.execute(id);
  }

  async updateStatus(
    id: number,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    const task = await this.updateTaskStatusUseCase.execute(id, dto);
    return TaskResponseDto.fromEntity(task);
  }

  async createAssignment(dto: CreateTaskAssignmentDto) {
    const assignment = await this.createAssignmentUseCase.execute(dto);
    return { task_id: assignment.task_id, user_id: assignment.user_id };
  }

  async findAssignments(taskId: number) {
    const list = await this.findAssignmentsUseCase.execute(taskId);
    return list.map((a) => ({
      task_id: a.task_id,
      user_id: a.user_id,
      user_name: a.user?.username,
    }));
  }

  async removeAssignment(taskId: number, userId: number): Promise<void> {
    await this.removeAssignmentUseCase.execute(taskId, userId);
  }

  async findChildren(taskId: number): Promise<TaskResponseDto[]> {
    const children = await this.findChildrenUseCase.execute(taskId);
    return TaskResponseDto.fromEntityList(children);
  }

  async reorder(dto: ReorderTaskDto): Promise<void> {
    await this.reorderTasksUseCase.execute(dto);
  }
}
