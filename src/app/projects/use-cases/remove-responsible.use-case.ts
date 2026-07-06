import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProjectResponsibleRepository } from '../repository/project-responsible-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from '../repository/project-responsible-repository.interface';

@Injectable()
export class RemoveResponsibleUseCase {
  constructor(
    @Inject(PROJECT_RESPONSIBLE_REPOSITORY)
    private readonly responsibleRepo: IProjectResponsibleRepository,
  ) {}

  async execute(projectId: number, userId: number): Promise<void> {
    const responsible = await this.responsibleRepo.findOneByProjectAndUser(
      projectId,
      userId,
    );
    if (!responsible) {
      throw new NotFoundException('Responsable no encontrado');
    }
    await this.responsibleRepo.delete(responsible);
  }
}
