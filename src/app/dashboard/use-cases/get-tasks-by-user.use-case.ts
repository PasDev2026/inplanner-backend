import { Injectable, Inject } from '@nestjs/common';
import type {
  IDashboardRepository,
  TasksByUserItem,
  DashboardScope,
} from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetTasksByUserUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(scope: DashboardScope): Promise<TasksByUserItem[]> {
    return this.dashboardRepo.getTasksByUser(scope);
  }
}
