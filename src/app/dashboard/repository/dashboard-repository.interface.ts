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

export interface MyTaskCounts {
  total: number;
  pending: number;
  inProgress: number;
  underReview: number;
  completed: number;
  overdue: number;
}

export interface UpcomingDeadlineItem {
  id_task: number;
  task_name: string;
  due_date: Date;
  status: number;
  priority: number;
  project_id: number;
  project_name: string;
}

export interface MyProjectItem {
  id_project: number;
  name_project: string;
  status: number;
  privacy_level: number;
  due_date: Date;
}

export interface ProjectProgressItem {
  id_project: number;
  name_project: string;
  total: number;
  completed: number;
}

export interface WeeklyActivityItem {
  week: string;
  created: number;
  completed: number;
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
  getMyTaskCounts(userId: string): Promise<MyTaskCounts>;
  getMyUpcomingDeadlines(
    userId: string,
    limit: number,
  ): Promise<UpcomingDeadlineItem[]>;
  getMyProjects(userId: string): Promise<MyProjectItem[]>;
  getMyProjectProgress(userId: string): Promise<ProjectProgressItem[]>;
  getMyWeeklyActivity(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<WeeklyActivityItem[]>;
}
