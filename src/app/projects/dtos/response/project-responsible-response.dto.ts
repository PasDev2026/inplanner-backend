import { ProjectResponsibleEntity } from '../../entities/project-responsible.entity';

export class ProjectResponsibleResponseDto {
  project_id: number;
  user_id: number;
  name?: string;
  apellido_paterno?: string;

  static fromEntity(
    entity: ProjectResponsibleEntity,
  ): ProjectResponsibleResponseDto {
    const dto = new ProjectResponsibleResponseDto();
    dto.project_id = entity.project_id;
    dto.user_id = entity.user_id;
    dto.name = entity.user?.name;
    dto.apellido_paterno = entity.user?.apellido_paterno;
    return dto;
  }

  static fromEntityList(
    entities: ProjectResponsibleEntity[],
  ): ProjectResponsibleResponseDto[] {
    return entities.map((e) => ProjectResponsibleResponseDto.fromEntity(e));
  }
}
