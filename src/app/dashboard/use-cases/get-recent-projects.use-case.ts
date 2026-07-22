import { Injectable, Inject } from '@nestjs/common';
import { ProjectEntity } from '../../projects/entities/project.entity';
import type { IDashboardRepository } from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetRecentProjectsUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(limit: number): Promise<ProjectEntity[]> {
    return this.dashboardRepo.getRecentProjects(limit);
  }
}
