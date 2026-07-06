import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';
import { ProjectEntity } from '../entities/project.entity';
import { UpdateProjectDto } from '../dtos/update-project.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(id: number, dto: UpdateProjectDto): Promise<ProjectEntity> {
    await this.projectRepo.update(id, dto as unknown as Partial<ProjectEntity>);
    const project = await this.projectRepo.findOneById(id);
    if (!project) {
      throw new NotFoundException('Proyecto con ID ' + id + ' no encontrado');
    }
    return project;
  }
}
