import { ProjectEntity } from '../../entities/project.entity';
import { ProjectResponsibleResponseDto } from './project-responsible-response.dto';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';

export class ProjectResponseDto {
  id_project: number;
  name_project: string;
  description_project: string | null;
  sede_id: number | null;
  manager_id: number;
  start_date: Date | null;
  due_date: Date | null;
  status: number | null;
  priority: number | null;
  privacy_level: number;
  position: number;
  created_at: Date;
  updated_at: Date;
  progress: number;
  responsibles?: ProjectResponsibleResponseDto[];

  static fromEntity(entity: ProjectEntity): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id_project = entity.id_project;
    dto.name_project = entity.name_project;
    dto.description_project = entity.description_project;
    dto.sede_id = entity.sede_id;
    dto.manager_id = entity.manager_id;
    dto.start_date = entity.start_date;
    dto.due_date = entity.due_date;
    dto.status = entity.status;
    dto.priority = entity.priority;
    dto.privacy_level = entity.privacy_level;
    dto.position = entity.position ?? 0;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    dto.progress = entity.progress ?? 0;
    if (entity.responsibles) {
      dto.responsibles = entity.responsibles.map((r) =>
        ProjectResponsibleResponseDto.fromEntity(r),
      );
    }
    return dto;
  }

  static fromEntityList(entities: ProjectEntity[]): ProjectResponseDto[] {
    return entities.map((e) => ProjectResponseDto.fromEntity(e));
  }

  static fromPaginated(
    result: PaginatedResult<ProjectEntity>,
  ): PaginatedResult<ProjectResponseDto> {
    return {
      data: ProjectResponseDto.fromEntityList(result.data),
      meta: result.meta,
    };
  }
}
