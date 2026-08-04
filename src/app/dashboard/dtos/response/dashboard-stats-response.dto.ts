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
  recentProjects: ProjectEntity[];

  static fromRaw(data: {
    projectCounts: ProjectCounts;
    taskCounts: TaskCounts;
    tasksByUser: TasksByUserItem[];
    recentProjects: ProjectEntity[];
  }): DashboardStatsResponseDto {
    const dto = new DashboardStatsResponseDto();
    dto.projectCounts = data.projectCounts;
    dto.taskCounts = data.taskCounts;
    dto.tasksByUser = data.tasksByUser;
    dto.recentProjects = data.recentProjects;
    return dto;
  }
}
