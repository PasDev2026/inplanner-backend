import { Injectable, Inject } from '@nestjs/common';
import type { IDashboardRepository, TaskCounts } from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetTaskCountsUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(): Promise<TaskCounts> {
    return this.dashboardRepo.getTaskCounts();
  }
}
