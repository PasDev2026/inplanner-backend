import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DB_SCHEMA } from '../../../config/schema';
import type {
  AreaDetail,
  AreaDetailProjectRow,
  AreaPerformanceRow,
  ExportProjectRow,
  ExportTaskRow,
  GeneralMetrics,
  IMcpRepository,
  OverdueTaskRow,
  ProjectSedeRow,
  UserActivity,
  UserActivityItem,
  UserActivitySummary,
  UserLoadRow,
} from '../repository/mcp-repository.interface';

/**
 * Consultas de solo lectura propias del MCP.
 *
 * Se usa SQL parametrizado (nunca se interpola entrada del usuario); lo único
 * interpolado es el nombre del esquema (`DB_SCHEMA`), que proviene del entorno.
 *
 * Atribución por área: igual que el dashboard — un proyecto pertenece al área
 * de su `manager` (`projects.manager_id -> users.area_id`).
 */
@Injectable()
export class McpTypeormRepository implements IMcpRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getAreaPerformance(areaIds?: number[]): Promise<AreaPerformanceRow[]> {
    const params: unknown[] = [];
    let where = '';
    if (areaIds && areaIds.length > 0) {
      params.push(areaIds);
      where = `WHERE a.id_area = ANY($1)`;
    }

    const sql = `
      SELECT
        a.id_area,
        a.nombre_area,
        COUNT(DISTINCT p.id_project)::int AS proyectos,
        COUNT(t.id_task)::int AS tareas,
        COUNT(t.id_task) FILTER (WHERE t.status = 4)::int AS completadas,
        COUNT(t.id_task) FILTER (WHERE t.status = 2)::int AS en_progreso,
        COUNT(t.id_task) FILTER (WHERE t.due_date < NOW() AND t.status <> 4)::int AS vencidas,
        COALESCE(
          ROUND(100.0 * COUNT(t.id_task) FILTER (WHERE t.status = 4)
            / NULLIF(COUNT(t.id_task), 0)),
          0
        )::int AS avance
      FROM ${DB_SCHEMA}.areas a
      JOIN ${DB_SCHEMA}.users u ON u.area_id = a.id_area
      JOIN ${DB_SCHEMA}.projects p ON p.manager_id = u.id_user
      LEFT JOIN ${DB_SCHEMA}.tasks t ON t.project_id = p.id_project
      ${where}
      GROUP BY a.id_area, a.nombre_area
      ORDER BY tareas DESC, a.nombre_area ASC
    `;
    return this.dataSource.query<AreaPerformanceRow[]>(sql, params);
  }

  async getAreaDetail(areaId: number): Promise<AreaDetail | null> {
    const [areaRows, userRows, projects] = await Promise.all([
      this.dataSource.query<
        { id_area: number; nombre_area: string; estado: boolean }[]
      >(
        `SELECT id_area, nombre_area, estado
         FROM ${DB_SCHEMA}.areas WHERE id_area = $1`,
        [areaId],
      ),
      this.dataSource.query<{ usuarios: number }[]>(
        `SELECT COUNT(*)::int AS usuarios
         FROM ${DB_SCHEMA}.users WHERE area_id = $1`,
        [areaId],
      ),
      this.dataSource.query<AreaDetailProjectRow[]>(
        `SELECT
           p.id_project,
           p.name_project,
           p.status,
           COUNT(t.id_task)::int AS tareas,
           COUNT(t.id_task) FILTER (WHERE t.status = 4)::int AS completadas
         FROM ${DB_SCHEMA}.projects p
         JOIN ${DB_SCHEMA}.users u ON u.id_user = p.manager_id
         LEFT JOIN ${DB_SCHEMA}.tasks t ON t.project_id = p.id_project
         WHERE u.area_id = $1
         GROUP BY p.id_project, p.name_project, p.status
         ORDER BY p.name_project ASC`,
        [areaId],
      ),
    ]);

    const area = areaRows[0];
    if (!area) return null;

    return {
      id_area: area.id_area,
      nombre_area: area.nombre_area,
      estado: area.estado,
      usuarios: userRows[0]?.usuarios ?? 0,
      proyectos: projects,
    };
  }

  async getUserActivity(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<UserActivity> {
    const params = [userId, from, to];

    const [summaryRows, items] = await Promise.all([
      this.dataSource.query<UserActivitySummary[]>(
        `SELECT
           COUNT(*) FILTER (WHERE t.created_at::date BETWEEN $2::date AND $3::date)::int AS creadas,
           COUNT(*) FILTER (WHERE t.updated_at::date BETWEEN $2::date AND $3::date)::int AS actualizadas,
           COUNT(*) FILTER (WHERE t.status = 4 AND t.updated_at::date BETWEEN $2::date AND $3::date)::int AS completadas
         FROM ${DB_SCHEMA}.tasks t
         JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
         WHERE ta.user_id = $1`,
        params,
      ),
      this.dataSource.query<UserActivityItem[]>(
        `SELECT t.id_task, t.task_name, t.status, t.project_id, t.created_at, t.updated_at
         FROM ${DB_SCHEMA}.tasks t
         JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
         WHERE ta.user_id = $1
           AND (
             t.created_at::date BETWEEN $2::date AND $3::date
             OR t.updated_at::date BETWEEN $2::date AND $3::date
           )
         ORDER BY GREATEST(t.created_at, t.updated_at) DESC
         LIMIT 200`,
        params,
      ),
    ]);

    const resumen: UserActivitySummary = summaryRows[0] ?? {
      creadas: 0,
      actualizadas: 0,
      completadas: 0,
    };
    return { resumen, tareas: items };
  }

  async getUserLoad(): Promise<UserLoadRow[]> {
    const sql = `
      SELECT
        u.id_user,
        u.name,
        u.apellido_paterno,
        COUNT(t.id_task)::int AS total,
        COUNT(t.id_task) FILTER (WHERE t.status = 0)::int AS pendientes,
        COUNT(t.id_task) FILTER (WHERE t.status = 2)::int AS en_progreso,
        COUNT(t.id_task) FILTER (WHERE t.status = 4)::int AS completadas,
        COUNT(t.id_task) FILTER (WHERE t.due_date < NOW() AND t.status <> 4)::int AS vencidas
      FROM ${DB_SCHEMA}.task_assignments ta
      JOIN ${DB_SCHEMA}.tasks t ON t.id_task = ta.task_id
      JOIN ${DB_SCHEMA}.users u ON u.id_user = ta.user_id
      GROUP BY u.id_user, u.name, u.apellido_paterno
      ORDER BY total DESC, u.name ASC
    `;
    return this.dataSource.query<UserLoadRow[]>(sql);
  }

  async getOverdueTasks(
    minDiasVencida?: number,
    projectId?: number,
  ): Promise<OverdueTaskRow[]> {
    const conditions = ['t.due_date < NOW()', 't.status <> 4'];
    const params: unknown[] = [];
    if (minDiasVencida !== undefined) {
      params.push(minDiasVencida);
      conditions.push(`(CURRENT_DATE - t.due_date::date) >= $${params.length}`);
    }
    if (projectId !== undefined) {
      params.push(projectId);
      conditions.push(`t.project_id = $${params.length}`);
    }

    const sql = `
      SELECT
        t.id_task,
        t.task_name,
        t.status,
        t.due_date,
        t.project_id,
        p.name_project AS project_name,
        (CURRENT_DATE - t.due_date::date)::int AS dias_vencida
      FROM ${DB_SCHEMA}.tasks t
      JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.due_date ASC
      LIMIT 200
    `;
    return this.dataSource.query<OverdueTaskRow[]>(sql, params);
  }

  async getGeneralMetrics(): Promise<GeneralMetrics> {
    const [projectRows, taskRows] = await Promise.all([
      this.dataSource.query<GeneralMetrics['proyectos'][]>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 0)::int AS planificacion,
           COUNT(*) FILTER (WHERE status = 1)::int AS activo,
           COUNT(*) FILTER (WHERE status = 2)::int AS en_espera,
           COUNT(*) FILTER (WHERE status = 3)::int AS completado,
           COUNT(*) FILTER (WHERE status = 4)::int AS cancelado
         FROM ${DB_SCHEMA}.projects`,
      ),
      this.dataSource.query<GeneralMetrics['tareas'][]>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 0)::int AS pendientes,
           COUNT(*) FILTER (WHERE status = 1)::int AS en_espera,
           COUNT(*) FILTER (WHERE status = 2)::int AS en_progreso,
           COUNT(*) FILTER (WHERE status = 3)::int AS en_revision,
           COUNT(*) FILTER (WHERE status = 4)::int AS completadas,
           COUNT(*) FILTER (WHERE due_date < NOW() AND status <> 4)::int AS vencidas
         FROM ${DB_SCHEMA}.tasks`,
      ),
    ]);

    return {
      proyectos: projectRows[0],
      tareas: taskRows[0],
    };
  }

  async getProjectsBySede(): Promise<ProjectSedeRow[]> {
    const sql = `
      SELECT
        p.sede_id,
        COUNT(*)::int AS proyectos,
        COUNT(*) FILTER (WHERE p.status = 3)::int AS completados
      FROM ${DB_SCHEMA}.projects p
      GROUP BY p.sede_id
      ORDER BY proyectos DESC
    `;
    return this.dataSource.query<ProjectSedeRow[]>(sql);
  }

  async getProjectsForExport(): Promise<ExportProjectRow[]> {
    const sql = `
      SELECT
        p.id_project,
        p.name_project,
        p.status,
        p.priority,
        u.name AS manager_name,
        p.sede_id,
        p.start_date,
        p.due_date,
        p.created_at
      FROM ${DB_SCHEMA}.projects p
      LEFT JOIN ${DB_SCHEMA}.users u ON u.id_user = p.manager_id
      ORDER BY p.id_project DESC
    `;
    return this.dataSource.query<ExportProjectRow[]>(sql);
  }

  async getTasksForExport(): Promise<ExportTaskRow[]> {
    const sql = `
      SELECT
        t.id_task,
        t.task_name,
        t.status,
        t.priority,
        p.name_project AS project_name,
        t.start_date,
        t.due_date,
        t.created_at,
        t.updated_at
      FROM ${DB_SCHEMA}.tasks t
      LEFT JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
      ORDER BY t.id_task DESC
    `;
    return this.dataSource.query<ExportTaskRow[]>(sql);
  }
}
