import { Injectable } from '@nestjs/common';
import { CreateProjectUseCase } from './use-cases/create-project.use-case';
import { FindProjectsUseCase } from './use-cases/find-projects.use-case';
import { FindProjectUseCase } from './use-cases/find-project.use-case';
import { UpdateProjectUseCase } from './use-cases/update-project.use-case';
import { DeleteProjectUseCase } from './use-cases/delete-project.use-case';
import { CreateResponsibleUseCase } from './use-cases/create-responsible.use-case';
import { FindResponsiblesUseCase } from './use-cases/find-responsibles.use-case';
import { RemoveResponsibleUseCase } from './use-cases/remove-responsible.use-case';
import { ReorderProjectsUseCase } from './use-cases/reorder-projects.use-case';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectDto } from './dtos/query-project.dto';
import { CreateProjectResponsibleDto } from './dtos/create-project-responsible.dto';
import { ReorderProjectDto } from './dtos/reorder-projects.dto';
import { ProjectResponseDto } from './dtos/response/project-response.dto';
import { ProjectResponsibleResponseDto } from './dtos/response/project-responsible-response.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import type { JwtPayload } from '../auth/interfaces/auth-types';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly findProjectsUseCase: FindProjectsUseCase,
    private readonly findProjectUseCase: FindProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly createResponsibleUseCase: CreateResponsibleUseCase,
    private readonly findResponsiblesUseCase: FindResponsiblesUseCase,
    private readonly removeResponsibleUseCase: RemoveResponsibleUseCase,
    private readonly reorderProjectsUseCase: ReorderProjectsUseCase,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.createProjectUseCase.execute(dto);
    return ProjectResponseDto.fromEntity(project);
  }

  async findAll(
    query: QueryProjectDto,
    user?: JwtPayload,
  ): Promise<PaginatedResult<ProjectResponseDto>> {
    const result = await this.findProjectsUseCase.execute(query, user);
    return ProjectResponseDto.fromPaginated(result);
  }

  async findOne(id: number, user?: JwtPayload): Promise<ProjectResponseDto> {
    const project = await this.findProjectUseCase.execute(id, user);
    return ProjectResponseDto.fromEntity(project);
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.updateProjectUseCase.execute(id, dto);
    return ProjectResponseDto.fromEntity(project);
  }

  async remove(id: number): Promise<void> {
    await this.deleteProjectUseCase.execute(id);
  }

  async reorder(dto: ReorderProjectDto): Promise<void> {
    await this.reorderProjectsUseCase.execute(dto);
  }

  async findKanban(user?: JwtPayload): Promise<ProjectResponseDto[]> {
    const projects = await this.findProjectsUseCase.findAll(user);
    return ProjectResponseDto.fromEntityList(projects);
  }

  async createResponsible(
    dto: CreateProjectResponsibleDto,
  ): Promise<ProjectResponsibleResponseDto> {
    const responsible = await this.createResponsibleUseCase.execute(dto);
    return ProjectResponsibleResponseDto.fromEntity(responsible);
  }

  async findResponsibles(
    projectId: number,
  ): Promise<ProjectResponsibleResponseDto[]> {
    const list = await this.findResponsiblesUseCase.execute(projectId);
    return ProjectResponsibleResponseDto.fromEntityList(list);
  }

  async removeResponsible(projectId: number, userId: string): Promise<void> {
    await this.removeResponsibleUseCase.execute(projectId, userId);
  }
}
