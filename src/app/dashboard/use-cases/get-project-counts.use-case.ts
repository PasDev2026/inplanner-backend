import { Injectable, Inject } from '@nestjs/common';
import type { IDashboardRepository, ProjectCounts } from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetProjectCountsUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(): Promise<ProjectCounts> {
    return this.dashboardRepo.getProjectCounts();
  }
}
