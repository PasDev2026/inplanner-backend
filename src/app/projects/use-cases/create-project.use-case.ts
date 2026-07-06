import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';
import { ProjectEntity } from '../entities/project.entity';
import { CreateProjectDto } from '../dtos/create-project.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(dto: CreateProjectDto): Promise<ProjectEntity> {
    if (
      dto.start_date &&
      dto.due_date &&
      new Date(dto.start_date) > new Date(dto.due_date)
    ) {
      throw new BadRequestException(
        'La fecha l�mite debe ser posterior a la fecha de inicio',
      );
    }
    const project = new ProjectEntity();
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }
}
