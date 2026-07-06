import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';

@Injectable()
export class DeleteProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const project = await this.projectRepo.findOneById(id);
    if (!project) {
      throw new NotFoundException('Proyecto con ID ' + id + ' no encontrado');
    }
    await this.projectRepo.delete(project);
  }
}
