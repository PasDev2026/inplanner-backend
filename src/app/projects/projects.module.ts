import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectResponsibleEntity } from './entities/project-responsible.entity';
import { PROJECT_REPOSITORY } from './repository/project-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from './repository/project-responsible-repository.interface';
import { ProjectTypeormRepository } from './persistence/project.typeorm.repository';
import { ProjectResponsibleTypeormRepository } from './persistence/project-responsible.typeorm.repository';
import { CreateProjectUseCase } from './use-cases/create-project.use-case';
import { FindProjectsUseCase } from './use-cases/find-projects.use-case';
import { FindProjectUseCase } from './use-cases/find-project.use-case';
import { UpdateProjectUseCase } from './use-cases/update-project.use-case';
import { DeleteProjectUseCase } from './use-cases/delete-project.use-case';
import { CreateResponsibleUseCase } from './use-cases/create-responsible.use-case';
import { FindResponsiblesUseCase } from './use-cases/find-responsibles.use-case';
import { RemoveResponsibleUseCase } from './use-cases/remove-responsible.use-case';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectResponsibleEntity]),
  ],
  controllers: [ProjectsController],
  providers: [
    { provide: PROJECT_REPOSITORY, useClass: ProjectTypeormRepository },
    {
      provide: PROJECT_RESPONSIBLE_REPOSITORY,
      useClass: ProjectResponsibleTypeormRepository,
    },
    CreateProjectUseCase,
    FindProjectsUseCase,
    FindProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
    CreateResponsibleUseCase,
    FindResponsiblesUseCase,
    RemoveResponsibleUseCase,
    ProjectsService,
  ],
  exports: [TypeOrmModule],
})
export class ProjectsModule {}
