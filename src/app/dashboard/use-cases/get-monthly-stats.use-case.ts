import { Injectable, Inject } from '@nestjs/common';
import type { IDashboardRepository, MonthlyCounts } from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

export interface MonthlyStatsResult {
  month: number;
  year: number;
  tasks: MonthlyCounts;
  projects: MonthlyCounts;
}

@Injectable()
export class GetMonthlyStatsUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(month: number, year: number): Promise<MonthlyStatsResult> {
    const [tasks, projects] = await Promise.all([
      this.dashboardRepo.getMonthlyTaskCounts(month, year),
      this.dashboardRepo.getMonthlyProjectCounts(month, year),
    ]);
    return { month, year, tasks, projects };
  }
}
