import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../../tasks/entities/task.entity';
import type { JwtPayload } from '../../auth/interfaces/auth-types';
import { DB_SCHEMA } from '../constants/report.constants';
import type { IReportsRepository } from '../repository/reports-repository.interface';
import type {
  ActivityReportRow,
  ReportFilters,
} from '../interfaces/report.interface';
import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';

class FiltersBuilder {
  params: unknown[] = [];
  where: string[] = [];

  param(value: unknown): string {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  addSearch(columns: string[], search?: string): void {
    if (!search) return;
    const p = this.param(`%${search}%`);
    this.where.push(`(${columns.map((c) => `${c} ILIKE ${p}`).join(' OR ')})`);
  }

  addIntList(column: string, csv?: string): void {
    if (!csv) return;
    const p = this.param(csv.split(','));
    this.where.push(`${column} = ANY(${p}::int[])`);
  }

  addUuidList(column: string, csv?: string): void {
    if (!csv) return;
    const p = this.param(csv.split(','));
    this.where.push(`${column} = ANY(${p}::uuid[])`);
  }

  addDateRange(column: string, from?: string, to?: string): void {
    if (from) {
      const p = this.param(from);
      this.where.push(`${column} >= ${p}::date`);
    }
    if (to) {
      const p = this.param(to);
      this.where.push(`${column} <= ${p}::date`);
    }
  }
}

const ACTIVITY_COLUMNS: Record<string, string> = {
  task_name: 't.task_name',
  status: 't.status',
  priority: 't.priority',
  start_date: 't.start_date',
  due_date: 't.due_date',
  created_at: 't.created_at',
  updated_at: 't.updated_at',
  project_name: 'p.name_project',
};

@Injectable()
export class ReportsTypeormRepository implements IReportsRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) {}

  async findActivities(
    filters: ReportFilters,
    user: JwtPayload,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ActivityReportRow>> {
    const { data, total } = await this.queryActivities(filters, user, {
      page,
      limit,
    });
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAllActivities(
    filters: ReportFilters,
    user: JwtPayload,
  ): Promise<ActivityReportRow[]> {
    const { data } = await this.queryActivities(filters, user, {});
    return data;
  }

  private async queryActivities(
    filters: ReportFilters,
    user: JwtPayload,
    paging: { page?: number; limit?: number },
  ): Promise<{ data: ActivityReportRow[]; total: number }> {
    const builder = this.buildFilters(filters, user, [
      't.task_name',
      'p.name_project',
    ]);
    const whereSql =
      builder.where.length > 0 ? `WHERE ${builder.where.join(' AND ')}` : '';
    const orderBy = this.orderBy(ACTIVITY_COLUMNS, filters, 't.created_at');

    const countSql = `SELECT COUNT(*)::int AS total
      FROM ${DB_SCHEMA}.tasks t
      JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
      ${this.managerJoin()}
      ${whereSql}`;
    const [countRow]: [{ total: number }] = await this.taskRepo.query(
      countSql,
      builder.params,
    );

    let pagingSql = '';
    const pagingParams: unknown[] = [];
    if (paging.limit) {
      pagingSql = ` LIMIT $${builder.params.length + 1} OFFSET $${
        builder.params.length + 2
      }`;
      pagingParams.push(paging.limit, ((paging.page ?? 1) - 1) * paging.limit);
    }

    const selectSql = `SELECT
      t.id_task, t.task_name, t.task_description, t.status, t.priority,
      t.start_date, t.due_date, t.created_at, t.updated_at, t.parent_task_id,
      p.id_project, p.name_project AS project_name, p.status AS project_status,
      p.due_date AS project_due_date, p.sede_id, p.manager_id,
      asgn.assignments
      FROM ${DB_SCHEMA}.tasks t
      JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
      ${this.managerJoin()}
      LEFT JOIN LATERAL (
        SELECT COALESCE(json_agg(json_build_object(
          'user_id', u.id_user,
          'name', u.name,
          'apellido_paterno', u.apellido_paterno
        ) ORDER BY u.name), '[]'::json) AS assignments
        FROM ${DB_SCHEMA}.task_assignments ta
        JOIN ${DB_SCHEMA}.users u ON u.id_user = ta.user_id
        WHERE ta.task_id = t.id_task
      ) asgn ON TRUE
      ${whereSql}
      ORDER BY ${orderBy}
      ${pagingSql}`;
    const data: ActivityReportRow[] = await this.taskRepo.query(selectSql, [
      ...builder.params,
      ...pagingParams,
    ]);

    return { data, total: countRow.total };
  }

  private buildFilters(
    filters: ReportFilters,
    user: JwtPayload,
    searchColumns: string[],
  ): FiltersBuilder {
    const b = new FiltersBuilder();
    if (!user.roles.some((r) => r.rol_codigo === 'SUPER_ADMINISTRADOR')) {
      const userId = b.param(user.sub);
      const privacy = [
        `p.manager_id = ${userId}`,
        `p.privacy_level = 0`,
        `(p.privacy_level = 4 AND p.manager_id = ${userId})`,
        `(p.privacy_level = 3 AND (p.manager_id = ${userId} OR EXISTS (
          SELECT 1 FROM ${DB_SCHEMA}.project_responsibles pr
          WHERE pr.project_id = p.id_project AND pr.user_id = ${userId}
        )))`,
        `(p.privacy_level = 1 AND pm.area_id IS NOT NULL AND pm.area_id = (
          SELECT u.area_id FROM ${DB_SCHEMA}.users u WHERE u.id_user = ${userId}
        ))`,
      ];
      const userSedes = user.roles
        .filter((r) => r.sede_id)
        .map((r) => r.sede_id);
      if (userSedes.length > 0) {
        const sedes = b.param(userSedes);
        privacy.push(
          `(p.privacy_level = 2 AND p.sede_id = ANY(${sedes}::uuid[]))`,
        );
      }
      b.where.push(`(${privacy.join(' OR ')})`);
    }
    b.addSearch(searchColumns, filters.search);
    b.addIntList('p.status', filters.status);
    b.addIntList('p.priority', filters.priority);
    b.addUuidList('p.sede_id', filters.sede_id);
    b.addIntList('t.project_id', filters.project_id);
    if (filters.responsible_id) {
      const p = b.param(filters.responsible_id.split(','));
      b.where.push(
        `EXISTS (SELECT 1 FROM ${DB_SCHEMA}.task_assignments ta WHERE ta.task_id = t.id_task AND ta.user_id = ANY(${p}::uuid[]))`,
      );
    }
    b.addDateRange('p.start_date', filters.dateFrom, filters.dateTo);
    return b;
  }

  private managerJoin(): string {
    return `LEFT JOIN ${DB_SCHEMA}.users pm ON pm.id_user = p.manager_id`;
  }

  private orderBy(
    columns: Record<string, string>,
    filters: ReportFilters,
    defaultCol: string,
  ): string {
    const col =
      filters.sortBy && columns[filters.sortBy]
        ? columns[filters.sortBy]
        : defaultCol;
    const dir = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    return `${col} ${dir}`;
  }
}
