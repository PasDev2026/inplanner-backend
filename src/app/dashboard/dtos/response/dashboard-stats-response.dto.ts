import { TaskEntity } from '../../../tasks/entities/task.entity';
import { ProjectEntity } from '../../../projects/entities/project.entity';
import type {
  ProjectCounts,
  TaskCounts,
  TasksByUserItem,
} from '../../repository/dashboard-repository.interface';

export class DashboardStatsResponseDto {
  projectCounts: ProjectCounts;
  taskCounts: TaskCounts;
  tasksByUser: TasksByUserItem[];
  upcomingDeadlines: TaskEntity[];
  recentProjects: ProjectEntity[];

  static fromRaw(data: {
    projectCounts: ProjectCounts;
    taskCounts: TaskCounts;
    tasksByUser: TasksByUserItem[];
    upcomingDeadlines: TaskEntity[];
    recentProjects: ProjectEntity[];
  }): DashboardStatsResponseDto {
    const dto = new DashboardStatsResponseDto();
    dto.projectCounts = data.projectCounts;
    dto.taskCounts = data.taskCounts;
    dto.tasksByUser = data.tasksByUser;
    dto.upcomingDeadlines = data.upcomingDeadlines;
    dto.recentProjects = data.recentProjects;
    return dto;
  }
}
