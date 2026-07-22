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
  ProjectCounts,
  TaskCounts,
  TasksByUserItem,
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
      .where('t.due_date >= NOW()')
      .orderBy('t.due_date', 'ASC')
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
}
