import { Inject, Injectable } from '@nestjs/common';
import { GetProjectCountsUseCase } from './use-cases/get-project-counts.use-case';
import { GetTaskCountsUseCase } from './use-cases/get-task-counts.use-case';
import { GetTasksByUserUseCase } from './use-cases/get-tasks-by-user.use-case';
import { GetUpcomingDeadlinesUseCase } from './use-cases/get-upcoming-deadlines.use-case';
import { GetRecentProjectsUseCase } from './use-cases/get-recent-projects.use-case';
import { GetMonthlyStatsUseCase } from './use-cases/get-monthly-stats.use-case';
import { DashboardStatsResponseDto } from './dtos/response/dashboard-stats-response.dto';
import type { MonthlyStatsResult } from './use-cases/get-monthly-stats.use-case';
import {
  DASHBOARD_REPOSITORY,
  type IDashboardRepository,
} from './repository/dashboard-repository.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly getProjectCountsUseCase: GetProjectCountsUseCase,
    private readonly getTaskCountsUseCase: GetTaskCountsUseCase,
    private readonly getTasksByUserUseCase: GetTasksByUserUseCase,
    private readonly getUpcomingDeadlinesUseCase: GetUpcomingDeadlinesUseCase,
    private readonly getRecentProjectsUseCase: GetRecentProjectsUseCase,
    private readonly getMonthlyStatsUseCase: GetMonthlyStatsUseCase,
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async getStats(): Promise<DashboardStatsResponseDto> {
    const [
      projectCounts,
      taskCounts,
      tasksByUser,
      upcomingDeadlines,
      recentProjects,
    ] = await Promise.all([
      this.getProjectCountsUseCase.execute(),
      this.getTaskCountsUseCase.execute(),
      this.getTasksByUserUseCase.execute(),
      this.getUpcomingDeadlinesUseCase.execute(10),
      this.getRecentProjectsUseCase.execute(5),
    ]);

    return DashboardStatsResponseDto.fromRaw({
      projectCounts,
      taskCounts,
      tasksByUser,
      upcomingDeadlines,
      recentProjects,
    });
  }

  async getMonthlyStats(
    month: number,
    year: number,
  ): Promise<MonthlyStatsResult> {
    return this.getMonthlyStatsUseCase.execute(month, year);
  }

  async getBySedeStats(month: number, year: number) {
    const [projects, tasks] = await Promise.all([
      this.dashboardRepo.getProjectsBySede(month, year),
      this.dashboardRepo.getTasksBySede(month, year),
    ]);
    const map = new Map<
      string,
      { sede_id: string; projects: number; tasks: number }
    >();
    for (const row of projects) {
      map.set(row.sede_id, {
        sede_id: row.sede_id,
        projects: row.count,
        tasks: 0,
      });
    }
    for (const row of tasks) {
      const existing = map.get(row.sede_id);
      if (existing) {
        existing.tasks = row.count;
      } else {
        map.set(row.sede_id, {
          sede_id: row.sede_id,
          projects: 0,
          tasks: row.count,
        });
      }
    }
    return Array.from(map.values());
  }
}
