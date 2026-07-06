import { InjectionToken } from '@nestjs/common';
import { ProjectResponsibleEntity } from '../entities/project-responsible.entity';
import { CreateProjectResponsibleDto } from '../dtos/create-project-responsible.dto';

export const PROJECT_RESPONSIBLE_REPOSITORY =
  'PROJECT_RESPONSIBLE_REPOSITORY' as InjectionToken;

export interface IProjectResponsibleRepository {
  findOneByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<ProjectResponsibleEntity | null>;
  create(dto: CreateProjectResponsibleDto): Promise<ProjectResponsibleEntity>;
  findByProjectId(projectId: number): Promise<ProjectResponsibleEntity[]>;
  delete(responsible: ProjectResponsibleEntity): Promise<void>;
  countByProjectAndUser(projectId: number, userId: number): Promise<number>;
}
