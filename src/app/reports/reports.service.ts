import { Injectable } from '@nestjs/common';
import { GetActivitiesUseCase } from './use-cases/get-activities.use-case';
import { QueryReportDto } from './dtos/query-report.dto';
import type { JwtPayload } from '../auth/interfaces/auth-types';
import { buildActivitiesWorkbook } from './lib/report-excel';
import { toActivityExcelRow } from './lib/report-labels';
import { buildHierarchyMap, sortByHierarchy } from './lib/report-hierarchy';

@Injectable()
export class ReportsService {
  constructor(private readonly getActivitiesUseCase: GetActivitiesUseCase) {}

  getActivities(query: QueryReportDto, user: JwtPayload) {
    return this.getActivitiesUseCase.execute(query, user);
  }

  async exportActivities(
    query: QueryReportDto,
    user: JwtPayload,
  ): Promise<Buffer> {
    const rows = await this.getActivitiesUseCase.findAll(query, user);
    const hierarchy = buildHierarchyMap(rows);
    const buffer = await buildActivitiesWorkbook(
      sortByHierarchy(rows, hierarchy).map((r) =>
        toActivityExcelRow(r, hierarchy.get(r.id_task)),
      ),
    );
    return buffer;
  }
}
