import { InjectionToken } from '@nestjs/common';
import { ProjectEntity } from '../entities/project.entity';
import { QueryProjectDto } from '../dtos/query-project.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import type { JwtPayload } from '../../auth/interfaces/auth-types';

export const PROJECT_REPOSITORY = 'PROJECT_REPOSITORY' as InjectionToken;

export interface IProjectRepository {
  save(project: ProjectEntity): Promise<ProjectEntity>;
  findWithPagination(
    query: QueryProjectDto,
    user?: JwtPayload,
  ): Promise<PaginatedResult<ProjectEntity>>;
  findOneById(id: number): Promise<ProjectEntity | null>;
  update(id: number, partial: Partial<ProjectEntity>): Promise<void>;
  delete(project: ProjectEntity): Promise<void>;
  isUserInSameArea(userId: number, managerId: number): Promise<boolean>;
  isUserInSede(userId: number, sedeId: number): Promise<boolean>;
  findSiblings(status: number): Promise<ProjectEntity[]>;
  updatePosition(id: number, position: number): Promise<void>;
  findAll(user?: JwtPayload): Promise<ProjectEntity[]>;
}
