import { Injectable, Inject } from '@nestjs/common';
import type { IDashboardRepository, TasksByUserItem } from '../repository/dashboard-repository.interface';
import { DASHBOARD_REPOSITORY } from '../repository/dashboard-repository.interface';

@Injectable()
export class GetTasksByUserUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepo: IDashboardRepository,
  ) {}

  async execute(): Promise<TasksByUserItem[]> {
    return this.dashboardRepo.getTasksByUser();
  }
}
