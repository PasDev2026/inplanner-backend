import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { TaskAssignmentEntity } from './entities/task-assignment.entity';
import { TASK_REPOSITORY } from './repository/task-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from './repository/task-assignment-repository.interface';
import { TaskTypeormRepository } from './persistence/task.typeorm.repository';
import { TaskAssignmentTypeormRepository } from './persistence/task-assignment.typeorm.repository';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { FindTasksUseCase } from './use-cases/find-tasks.use-case';
import { FindTaskUseCase } from './use-cases/find-task.use-case';
import { UpdateTaskUseCase } from './use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './use-cases/delete-task.use-case';
import { UpdateTaskStatusUseCase } from './use-cases/update-task-status.use-case';
import { CreateAssignmentUseCase } from './use-cases/create-assignment.use-case';
import { FindAssignmentsUseCase } from './use-cases/find-assignments.use-case';
import { RemoveAssignmentUseCase } from './use-cases/remove-assignment.use-case';
import { FindChildrenUseCase } from './use-cases/find-children.use-case';
import { ReorderTasksUseCase } from './use-cases/reorder-tasks.use-case';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, TaskAssignmentEntity])],
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: TaskTypeormRepository },
    {
      provide: TASK_ASSIGNMENT_REPOSITORY,
      useClass: TaskAssignmentTypeormRepository,
    },
    CreateTaskUseCase,
    FindTasksUseCase,
    FindTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    UpdateTaskStatusUseCase,
    CreateAssignmentUseCase,
    FindAssignmentsUseCase,
    RemoveAssignmentUseCase,
    FindChildrenUseCase,
    ReorderTasksUseCase,
    TasksService,
  ],
  exports: [TypeOrmModule],
})
export class TasksModule {}
