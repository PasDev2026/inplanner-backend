import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GetProjectCountsUseCase } from './use-cases/get-project-counts.use-case';
import { GetTaskCountsUseCase } from './use-cases/get-task-counts.use-case';
import { GetTasksByUserUseCase } from './use-cases/get-tasks-by-user.use-case';
import { GetUpcomingDeadlinesUseCase } from './use-cases/get-upcoming-deadlines.use-case';
import { GetRecentProjectsUseCase } from './use-cases/get-recent-projects.use-case';
import { GetMonthlyStatsUseCase } from './use-cases/get-monthly-stats.use-case';
import { DashboardStatsResponseDto } from './dtos/response/dashboard-stats-response.dto';
import type { MonthlyStatsResult } from './use-cases/get-monthly-stats.use-case';
import type { TaskEntity } from '../../app/tasks/entities/task.entity';
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
    const [projectCounts, taskCounts, tasksByUser, recentProjects] =
      await Promise.all([
        this.getProjectCountsUseCase.execute(),
        this.getTaskCountsUseCase.execute(),
        this.getTasksByUserUseCase.execute(),
        this.getRecentProjectsUseCase.execute(5),
      ]);

    return DashboardStatsResponseDto.fromRaw({
      projectCounts,
      taskCounts,
      tasksByUser,
      recentProjects,
    });
  }

  async getUpcomingDeadlines(limit: number): Promise<TaskEntity[]> {
    return this.getUpcomingDeadlinesUseCase.execute(limit);
  }

  async getMonthlyStats(
    month: number,
    year: number,
  ): Promise<MonthlyStatsResult> {
    return this.getMonthlyStatsUseCase.execute(month, year);
  }

  async getMyStats(userId: string) {
    const [taskCounts, myProjects, projectProgress] = await Promise.all([
      this.dashboardRepo.getMyTaskCounts(userId),
      this.dashboardRepo.getMyProjects(userId),
      this.dashboardRepo.getMyProjectProgress(userId),
    ]);
    return { taskCounts, myProjects, projectProgress };
  }

  async getMyUpcomingDeadlines(userId: string, limit: number) {
    return this.dashboardRepo.getMyUpcomingDeadlines(userId, limit);
  }

  async getMyWeeklyActivity(userId: string, from?: string, to?: string) {
    const toDate = this.parseDateParam(to) ?? new Date();
    const fromDate =
      this.parseDateParam(from) ??
      new Date(toDate.getTime() - 7 * 7 * 24 * 60 * 60 * 1000);
    if (fromDate > toDate) {
      throw new BadRequestException('El rango de fechas es inválido');
    }
    return this.dashboardRepo.getMyWeeklyActivity(userId, fromDate, toDate);
  }

  private parseDateParam(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
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
