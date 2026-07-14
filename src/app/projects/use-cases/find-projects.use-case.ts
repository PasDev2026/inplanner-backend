import { Injectable, Inject } from '@nestjs/common';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { PROJECT_REPOSITORY } from '../repository/project-repository.interface';
import { QueryProjectDto } from '../dtos/query-project.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { ProjectEntity } from '../entities/project.entity';
import type { JwtPayload } from '../../auth/interfaces/auth-types';

@Injectable()
export class FindProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(
    query: QueryProjectDto,
    user?: JwtPayload,
  ): Promise<PaginatedResult<ProjectEntity>> {
    return this.projectRepo.findWithPagination(query, user);
  }

  async findAll(user?: JwtPayload): Promise<ProjectEntity[]> {
    return this.projectRepo.findAll(user);
  }
}
