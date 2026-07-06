import { Injectable, Inject } from '@nestjs/common';
import type { IProjectResponsibleRepository } from '../repository/project-responsible-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from '../repository/project-responsible-repository.interface';
import { ProjectResponsibleEntity } from '../entities/project-responsible.entity';

@Injectable()
export class FindResponsiblesUseCase {
  constructor(
    @Inject(PROJECT_RESPONSIBLE_REPOSITORY)
    private readonly responsibleRepo: IProjectResponsibleRepository,
  ) {}

  async execute(projectId: number): Promise<ProjectResponsibleEntity[]> {
    return this.responsibleRepo.findByProjectId(projectId);
  }
}
