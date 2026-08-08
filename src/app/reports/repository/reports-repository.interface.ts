import { InjectionToken } from '@nestjs/common';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import type {
  ActivityReportRow,
  ReportFilters,
} from '../interfaces/report.interface';

export const REPORTS_REPOSITORY = 'REPORTS_REPOSITORY' as InjectionToken;

export interface IReportsRepository {
  findActivities(
    filters: ReportFilters,
    user: JwtPayload,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ActivityReportRow>>;
  findAllActivities(
    filters: ReportFilters,
    user: JwtPayload,
  ): Promise<ActivityReportRow[]>;
}
