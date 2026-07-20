import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';
import type { IProjectResponsibleRepository } from '../repository/project-responsible-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from '../repository/project-responsible-repository.interface';
import { ProjectEntity } from '../entities/project.entity';
import { PrivacyLevel } from '../../../common/enums/privacy-level.enum';
import type { JwtPayload } from '../../auth/interfaces/auth-types';

@Injectable()
export class FindProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(PROJECT_RESPONSIBLE_REPOSITORY)
    private readonly responsibleRepo: IProjectResponsibleRepository,
  ) {}

  async execute(id: number, user?: JwtPayload): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOneById(id);
    if (!project) {
      throw new NotFoundException('Proyecto con ID ' + id + ' no encontrado');
    }
    if (
      user &&
      !user.roles.some((r) => r.rol_codigo === 'SUPER_ADMINISTRADOR')
    ) {
      const canSee = await this.canSeeProject(project, user);
      if (!canSee) {
        throw new NotFoundException('Proyecto con ID ' + id + ' no encontrado');
      }
    }
    return project;
  }

  private async canSeeProject(
    project: ProjectEntity,
    user: JwtPayload,
  ): Promise<boolean> {
    const userId = user.sub;
    if (project.manager_id === userId) return true;
    if (project.privacy_level === PrivacyLevel.PUBLICO) return true;
    if (project.privacy_level === PrivacyLevel.PRIVADO)
      return project.manager_id === userId;
    if (project.privacy_level === PrivacyLevel.SOLO_MENCIONADOS) {
      if (project.manager_id === userId) return true;
      const count = await this.responsibleRepo.countByProjectAndUser(
        project.id_project,
        userId,
      );
      return count > 0;
    }
    if (project.privacy_level === PrivacyLevel.SOLO_AREA) {
      return this.projectRepo.isUserInSameArea(userId, project.manager_id);
    }
    if (project.privacy_level === PrivacyLevel.SOLO_SEDE) {
      if (!project.sede_id) return false;
      return user.roles.some((r) => r.sede_id === project.sede_id);
    }
    return false;
  }
}
