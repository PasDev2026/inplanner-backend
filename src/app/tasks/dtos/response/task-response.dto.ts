import { TaskEntity } from '../../entities/task.entity';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';

export class TaskResponseDto {
  id_task: number;
  task_name: string;
  task_description: string | null;
  project_id: number;
  parent_task_id: number | null;
  created_by_id: number;
  completed_by_id: number | null;
  start_date: Date | null;
  due_date: Date | null;
  status: number | null;
  priority: number | null;
  created_at: Date;
  updated_at: Date;
  subtasks_count?: number;
  assignments?: { task_id: number; user_id: number; user_name?: string }[];
  notes?: {
    id_note: number;
    content: string;
    task_id: number;
    created_by_id: number;
    created_at: Date;
    updated_at: Date;
    createdBy?: {
      id_user: number;
      name: string;
      apellido_paterno: string | null;
      email: string;
    };
  }[];

  static fromEntity(entity: TaskEntity): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id_task = entity.id_task;
    dto.task_name = entity.task_name;
    dto.task_description = entity.task_description;
    dto.project_id = entity.project_id;
    dto.parent_task_id = entity.parent_task_id;
    dto.created_by_id = entity.created_by_id;
    dto.completed_by_id = entity.completed_by_id;
    dto.start_date = entity.start_date;
    dto.due_date = entity.due_date;
    dto.status = entity.status;
    dto.priority = entity.priority;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    dto.subtasks_count = entity.subtasks_count;
    if (entity.assignments) {
      dto.assignments = entity.assignments.map((a) => ({
        task_id: a.task_id,
        user_id: a.user_id,
        user_name: a.user?.username,
      }));
    }
    if (entity.notes) {
      dto.notes = entity.notes.map((n) => ({
        id_note: n.id_note,
        content: n.content,
        task_id: n.task_id,
        created_by_id: n.created_by_id,
        created_at: n.created_at,
        updated_at: n.updated_at,
        createdBy: n.createdBy
          ? {
              id_user: n.createdBy.id_user,
              name: n.createdBy.name,
              apellido_paterno: n.createdBy.apellido_paterno,
              email: n.createdBy.email,
            }
          : undefined,
      }));
    }
    return dto;
  }

  static fromEntityList(entities: TaskEntity[]): TaskResponseDto[] {
    return entities.map((e) => TaskResponseDto.fromEntity(e));
  }

  static fromPaginated(
    result: PaginatedResult<TaskEntity>,
  ): PaginatedResult<TaskResponseDto> {
    return {
      data: TaskResponseDto.fromEntityList(result.data),
      meta: result.meta,
    };
  }
}
