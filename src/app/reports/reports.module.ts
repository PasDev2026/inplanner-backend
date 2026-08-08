import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../tasks/entities/task.entity';
import { REPORTS_REPOSITORY } from './repository/reports-repository.interface';
import { ReportsTypeormRepository } from './persistence/reports.typeorm.repository';
import { GetActivitiesUseCase } from './use-cases/get-activities.use-case';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])],
  controllers: [ReportsController],
  providers: [
    { provide: REPORTS_REPOSITORY, useClass: ReportsTypeormRepository },
    GetActivitiesUseCase,
    ReportsService,
  ],
})
export class ReportsModule {}
