import { InjectionToken } from '@nestjs/common';
import { TaskEntity } from '../../tasks/entities/task.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

export const DASHBOARD_REPOSITORY = 'DASHBOARD_REPOSITORY' as InjectionToken;

export interface ProjectCounts {
  total: number;
  planning: number;
  active: number;
  onHold: number;
  completed: number;
  cancelled: number;
}

export interface TaskCounts {
  total: number;
  pending: number;
  inProgress: number;
  underReview: number;
  completed: number;
  overdue: number;
}

export interface TasksByUserItem {
  userId: string;
  name: string;
  email: string;
  pending: number;
  total: number;
}

export interface MonthlyCounts {
  total: number;
  completed: number;
}

export interface BySedeRow {
  sede_id: string;
  count: number;
}

export interface IDashboardRepository {
  getProjectCounts(): Promise<ProjectCounts>;
  getTaskCounts(): Promise<TaskCounts>;
  getTasksByUser(): Promise<TasksByUserItem[]>;
  getUpcomingDeadlines(limit: number): Promise<TaskEntity[]>;
  getRecentProjects(limit: number): Promise<ProjectEntity[]>;
  getMonthlyTaskCounts(month: number, year: number): Promise<MonthlyCounts>;
  getMonthlyProjectCounts(month: number, year: number): Promise<MonthlyCounts>;
  getProjectsBySede(month: number, year: number): Promise<BySedeRow[]>;
  getTasksBySede(month: number, year: number): Promise<BySedeRow[]>;
}
