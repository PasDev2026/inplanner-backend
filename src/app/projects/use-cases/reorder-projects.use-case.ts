import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';
import { ProjectEntity } from '../entities/project.entity';
import { ReorderProjectDto } from '../dtos/reorder-projects.dto';

@Injectable()
export class ReorderProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(dto: ReorderProjectDto): Promise<void> {
    const project = await this.projectRepo.findOneById(dto.projectId);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const status = dto.targetStatus ?? project.status ?? 0;
    const siblings = await this.projectRepo.findSiblings(status);

    const ordered = siblings
      .filter((s) => s.id_project !== dto.projectId)
      .sort((a, b) => a.position - b.position);

    const targetIndex = Math.min(
      Math.max(0, Math.round(dto.position)),
      ordered.length,
    );

    let newPosition: number;
    if (ordered.length === 0) {
      newPosition = 1000;
    } else if (targetIndex === 0) {
      newPosition = ordered[0].position / 2;
    } else if (targetIndex >= ordered.length) {
      newPosition = ordered[ordered.length - 1].position + 1000;
    } else {
      newPosition =
        (ordered[targetIndex - 1].position + ordered[targetIndex].position) / 2;
    }

    if (this.shouldReindex(newPosition, ordered, targetIndex)) {
      await this.reindexColumn(status);
      return this.execute(dto);
    }

    if (dto.targetStatus != null && dto.targetStatus !== project.status) {
      await this.projectRepo.update(dto.projectId, {
        status: dto.targetStatus,
      });
    }

    await this.projectRepo.updatePosition(dto.projectId, newPosition);
  }

  private shouldReindex(
    position: number,
    siblings: ProjectEntity[],
    index: number,
  ): boolean {
    const gap =
      index === 0
        ? position
        : index >= siblings.length
          ? siblings[siblings.length - 1].position -
            (siblings[siblings.length - 2]?.position ?? 0)
          : siblings[index].position - siblings[index - 1].position;
    return Math.abs(gap) < 0.001;
  }

  private async reindexColumn(status: number): Promise<void> {
    const siblings = await this.projectRepo.findSiblings(status);
    const ordered = siblings.sort((a, b) => a.position - b.position);
    for (let i = 0; i < ordered.length; i++) {
      await this.projectRepo.updatePosition(
        ordered[i].id_project,
        (i + 1) * 1000,
      );
    }
  }
}
