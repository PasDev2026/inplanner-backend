import { Injectable, Inject } from '@nestjs/common';
import type { IReportsRepository } from '../repository/reports-repository.interface';
import { REPORTS_REPOSITORY } from '../repository/reports-repository.interface';
import { QueryReportDto } from '../dtos/query-report.dto';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import type { ActivityReportRow } from '../interfaces/report.interface';
import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class GetActivitiesUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repository: IReportsRepository,
  ) {}

  execute(
    query: QueryReportDto,
    user: JwtPayload,
  ): Promise<PaginatedResult<ActivityReportRow>> {
    return this.repository.findActivities(
      query,
      user,
      query.page ?? 1,
      query.limit ?? 50,
    );
  }

  findAll(
    query: QueryReportDto,
    user: JwtPayload,
  ): Promise<ActivityReportRow[]> {
    return this.repository.findAllActivities(query, user);
  }
}
