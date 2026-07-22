import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../tasks/entities/task.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DASHBOARD_REPOSITORY } from './repository/dashboard-repository.interface';
import { DashboardTypeormRepository } from './persistence/dashboard.typeorm.repository';
import { GetProjectCountsUseCase } from './use-cases/get-project-counts.use-case';
import { GetTaskCountsUseCase } from './use-cases/get-task-counts.use-case';
import { GetTasksByUserUseCase } from './use-cases/get-tasks-by-user.use-case';
import { GetUpcomingDeadlinesUseCase } from './use-cases/get-upcoming-deadlines.use-case';
import { GetRecentProjectsUseCase } from './use-cases/get-recent-projects.use-case';
import { GetMonthlyStatsUseCase } from './use-cases/get-monthly-stats.use-case';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, ProjectEntity, UserEntity])],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardTypeormRepository },
    GetProjectCountsUseCase,
    GetTaskCountsUseCase,
    GetTasksByUserUseCase,
    GetUpcomingDeadlinesUseCase,
    GetRecentProjectsUseCase,
    GetMonthlyStatsUseCase,
    DashboardService,
  ],
})
export class DashboardModule {}
