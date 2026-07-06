import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IProjectResponsibleRepository } from '../repository/project-responsible-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from '../repository/project-responsible-repository.interface';
import { ProjectResponsibleEntity } from '../entities/project-responsible.entity';
import { CreateProjectResponsibleDto } from '../dtos/create-project-responsible.dto';

@Injectable()
export class CreateResponsibleUseCase {
  constructor(
    @Inject(PROJECT_RESPONSIBLE_REPOSITORY)
    private readonly responsibleRepo: IProjectResponsibleRepository,
  ) {}

  async execute(
    dto: CreateProjectResponsibleDto,
  ): Promise<ProjectResponsibleEntity> {
    const existing = await this.responsibleRepo.findOneByProjectAndUser(
      dto.project_id!,
      dto.user_id,
    );
    if (existing) {
      throw new ConflictException(
        'El usuario ya es responsable de este proyecto',
      );
    }
    return this.responsibleRepo.create(dto);
  }
}
