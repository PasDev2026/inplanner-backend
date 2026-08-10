import { Injectable, Inject } from '@nestjs/common';
import { TaskEntity } from '../../tasks/entities/task.entity';
import type {
  IDashboardRepository,
  DashboardScope,
} from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetUpcomingDeadlinesUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(limit: number, scope: DashboardScope): Promise<TaskEntity[]> {
    return this.dashboardRepo.getUpcomingDeadlines(limit, scope);
  }
}
