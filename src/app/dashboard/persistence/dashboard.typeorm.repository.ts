import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../../tasks/entities/task.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';
import type {
  BySedeRow,
  IDashboardRepository,
  MonthlyCounts,
  MyProjectItem,
  MyTaskCounts,
  ProjectCounts,
  ProjectProgressItem,
  TaskCounts,
  TasksByUserItem,
  UpcomingDeadlineItem,
  WeeklyActivityItem,
} from '../repository/dashboard-repository.interface';

const DB_SCHEMA = 'inplanner';

@Injectable()
export class DashboardTypeormRepository implements IDashboardRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getProjectCounts(): Promise<ProjectCounts> {
    const sql = `SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0)::int AS planning,
      COALESCE(SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END), 0)::int AS active,
      COALESCE(SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END), 0)::int AS "onHold",
      COALESCE(SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END), 0)::int AS completed,
      COALESCE(SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END), 0)::int AS cancelled
    FROM ${DB_SCHEMA}.projects`;
    const [row]: [ProjectCounts] = await this.projectRepo.query(sql);
    return row;
  }

  async getTaskCounts(): Promise<TaskCounts> {
    const sql = `SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END), 0)::int AS pending,
      COALESCE(SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END), 0)::int AS "inProgress",
      COALESCE(SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END), 0)::int AS "underReview",
      COALESCE(SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END), 0)::int AS completed,
      COALESCE(SUM(CASE WHEN due_date < NOW() AND status != 4 THEN 1 ELSE 0 END), 0)::int AS overdue
    FROM ${DB_SCHEMA}.tasks`;
    const [row]: [TaskCounts] = await this.taskRepo.query(sql);
    return row;
  }

  async getTasksByUser(): Promise<TasksByUserItem[]> {
    const sql = `SELECT
      u.id_user AS "userId",
      u.name,
      u.email,
      COALESCE(SUM(CASE WHEN t.status != 4 THEN 1 ELSE 0 END), 0)::int AS pending,
      COUNT(t.id_task)::int AS total
    FROM ${DB_SCHEMA}.task_assignments ta
    JOIN ${DB_SCHEMA}.tasks t ON t.id_task = ta.task_id
    JOIN ${DB_SCHEMA}.users u ON u.id_user = ta.user_id
    GROUP BY u.id_user, u.name, u.email
    ORDER BY pending DESC`;
    return this.taskRepo.query<TasksByUserItem[]>(sql);
  }

  async getUpcomingDeadlines(limit: number): Promise<TaskEntity[]> {
    return this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'p')
      .where('t.status != 4')
      .andWhere('t.due_date IS NOT NULL')
      .orderBy('t.due_date', 'ASC')
      .addOrderBy('t.id_task', 'ASC')
      .take(limit)
      .getMany();
  }

  async getRecentProjects(limit: number): Promise<ProjectEntity[]> {
    return this.projectRepo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getMonthlyTaskCounts(
    month: number,
    year: number,
  ): Promise<MonthlyCounts> {
    const sql = `SELECT
      COUNT(*)::int AS total,
      COALESCE(COUNT(*) FILTER (WHERE status = 4), 0)::int AS completed
    FROM ${DB_SCHEMA}.tasks
    WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`;
    const [row]: [MonthlyCounts] = await this.taskRepo.query(sql, [
      month,
      year,
    ]);
    return row;
  }

  async getMonthlyProjectCounts(
    month: number,
    year: number,
  ): Promise<MonthlyCounts> {
    const sql = `SELECT
      COUNT(*)::int AS total,
      COALESCE(COUNT(*) FILTER (WHERE status = 3), 0)::int AS completed
    FROM ${DB_SCHEMA}.projects
    WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`;
    const [row]: [MonthlyCounts] = await this.projectRepo.query(sql, [
      month,
      year,
    ]);
    return row;
  }

  async getProjectsBySede(month: number, year: number): Promise<BySedeRow[]> {
    const sql = `SELECT p.sede_id, COUNT(*)::int AS count
    FROM ${DB_SCHEMA}.projects p
    WHERE p.sede_id IS NOT NULL
      AND EXTRACT(MONTH FROM p.created_at) = $1
      AND EXTRACT(YEAR FROM p.created_at) = $2
    GROUP BY p.sede_id`;
    return this.projectRepo.query(sql, [month, year]);
  }

  async getTasksBySede(month: number, year: number): Promise<BySedeRow[]> {
    const sql = `SELECT p.sede_id, COUNT(*)::int AS count
    FROM ${DB_SCHEMA}.tasks t
    JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
    WHERE p.sede_id IS NOT NULL
      AND EXTRACT(MONTH FROM t.created_at) = $1
      AND EXTRACT(YEAR FROM t.created_at) = $2
    GROUP BY p.sede_id`;
    return this.taskRepo.query(sql, [month, year]);
  }

  async getMyTaskCounts(userId: string): Promise<MyTaskCounts> {
    const sql = `SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN t.status = 0 THEN 1 ELSE 0 END), 0)::int AS pending,
      COALESCE(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END), 0)::int AS "inProgress",
      COALESCE(SUM(CASE WHEN t.status = 3 THEN 1 ELSE 0 END), 0)::int AS "underReview",
      COALESCE(SUM(CASE WHEN t.status = 4 THEN 1 ELSE 0 END), 0)::int AS completed,
      COALESCE(SUM(CASE WHEN t.due_date < NOW() AND t.status != 4 THEN 1 ELSE 0 END), 0)::int AS overdue
    FROM ${DB_SCHEMA}.tasks t
    JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
    WHERE ta.user_id = $1`;
    const [row]: [MyTaskCounts] = await this.taskRepo.query(sql, [userId]);
    return row;
  }

  async getMyUpcomingDeadlines(
    userId: string,
    limit: number,
  ): Promise<UpcomingDeadlineItem[]> {
    const sql = `SELECT
      t.id_task, t.task_name, t.due_date, t.status, t.priority,
      p.id_project, p.name_project AS project_name
    FROM ${DB_SCHEMA}.tasks t
    JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
    JOIN ${DB_SCHEMA}.projects p ON p.id_project = t.project_id
    WHERE ta.user_id = $1 AND t.status != 4 AND t.due_date IS NOT NULL
    ORDER BY t.due_date ASC, t.id_task ASC
    LIMIT $2`;
    return this.taskRepo.query<UpcomingDeadlineItem[]>(sql, [userId, limit]);
  }

  async getMyProjects(userId: string): Promise<MyProjectItem[]> {
    const sql = `SELECT DISTINCT p.id_project, p.name_project, p.status, p.privacy_level, p.due_date
    FROM ${DB_SCHEMA}.projects p
    LEFT JOIN ${DB_SCHEMA}.project_responsibles pr ON pr.project_id = p.id_project
    WHERE p.manager_id = $1 OR pr.user_id = $1
    ORDER BY p.due_date ASC`;
    return this.projectRepo.query<MyProjectItem[]>(sql, [userId]);
  }

  async getMyProjectProgress(userId: string): Promise<ProjectProgressItem[]> {
    const sql = `SELECT
      p.id_project, p.name_project,
      COUNT(t.id_task)::int AS total,
      COUNT(t.id_task) FILTER (WHERE t.status = 4)::int AS completed
    FROM ${DB_SCHEMA}.projects p
    LEFT JOIN ${DB_SCHEMA}.tasks t ON t.project_id = p.id_project
    WHERE p.manager_id = $1
      OR EXISTS (
        SELECT 1 FROM ${DB_SCHEMA}.project_responsibles pr
        WHERE pr.project_id = p.id_project AND pr.user_id = $1
      )
    GROUP BY p.id_project, p.name_project, p.due_date
    ORDER BY p.due_date ASC`;
    return this.projectRepo.query<ProjectProgressItem[]>(sql, [userId]);
  }

  async getMyWeeklyActivity(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<WeeklyActivityItem[]> {
    // ponytail: no hay columna completed_at; se usa updated_at como proxy de la fecha de cierre
    const sql = `SELECT
      to_char(date_trunc('week', ev.d), 'YYYY-MM-DD') AS week,
      COUNT(*) FILTER (WHERE ev.kind = 'created')::int AS created,
      COUNT(*) FILTER (WHERE ev.kind = 'completed')::int AS completed
    FROM (
      SELECT 'created' AS kind, t.created_at AS d
      FROM ${DB_SCHEMA}.tasks t
      JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
      WHERE ta.user_id = $1
      UNION ALL
      SELECT 'completed' AS kind, t.updated_at AS d
      FROM ${DB_SCHEMA}.tasks t
      JOIN ${DB_SCHEMA}.task_assignments ta ON ta.task_id = t.id_task
      WHERE ta.user_id = $1 AND t.status = 4
    ) ev
    WHERE ev.d >= $2::date AND ev.d <= $3::date
    GROUP BY date_trunc('week', ev.d)
    ORDER BY date_trunc('week', ev.d)`;
    return this.taskRepo.query<WeeklyActivityItem[]>(sql, [userId, from, to]);
  }
}
