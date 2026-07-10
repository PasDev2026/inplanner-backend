import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import type { IProjectRepository } from '../repository/project-repository.interface';
import { QueryProjectDto } from '../dtos/query-project.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { DB_SCHEMA } from '../../../config/schema';
import { PrivacyLevel } from '../../../common/enums/privacy-level.enum';
import { Role } from '../../../common/enums/role.enum';
import type { JwtPayload } from '../../auth/interfaces/auth-types';

@Injectable()
export class ProjectTypeormRepository implements IProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repo: Repository<ProjectEntity>,
  ) {}

  async save(project: ProjectEntity): Promise<ProjectEntity> {
    return this.repo.save(project);
  }

  async findWithPagination(
    query: QueryProjectDto,
    user?: JwtPayload,
  ): Promise<PaginatedResult<ProjectEntity>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      sede_id,
      manager_id,
      responsible_id,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const idQb = this.repo.createQueryBuilder('project');
    idQb.select('project.id_project', 'id');

    // Use leftJoin (not leftJoinAndSelect) to avoid DISTINCT wrapper
    idQb.leftJoin('project.responsibles', 'responsibles');
    idQb.leftJoin('responsibles.user', 'responsibleUser');

    if (search) {
      idQb.andWhere('project.name_project ILIKE :search', {
        search: '%' + search + '%',
      });
    }
    if (status) {
      const statuses = status.split(',').map(Number);
      idQb.andWhere('project.status IN (:...statuses)', { statuses });
    }
    if (priority) {
      const priorities = priority.split(',').map(Number);
      idQb.andWhere('project.priority IN (:...priorities)', { priorities });
    }
    if (sede_id) {
      const sedeIds = sede_id.split(',').map(Number);
      idQb.andWhere('project.sede_id IN (:...sedeIds)', { sedeIds });
    }
    if (manager_id !== undefined) {
      idQb.andWhere('project.manager_id = :managerId', {
        managerId: manager_id,
      });
    }
    if (responsible_id) {
      const responsibleIds = responsible_id.split(',').map(Number);
      idQb.andWhere('responsibles.user_id IN (:...responsibleIds)', {
        responsibleIds,
      });
    }
    if (dateFrom && dateTo) {
      idQb.andWhere('project.start_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });
    } else if (dateFrom) {
      idQb.andWhere('project.start_date >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    } else if (dateTo) {
      idQb.andWhere('project.start_date <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    if (user && !user.roles.includes(Role.SUPER_ADMIN)) {
      this.applyPrivacyFilter(idQb, user.sub);
    }

    if (sortBy === 'responsible_name') {
      idQb.addSelect(
        `(SELECT MIN(u.name) FROM ${DB_SCHEMA}.project_responsibles pr
          JOIN ${DB_SCHEMA}.users u ON u.id_user = pr.user_id
          WHERE pr.project_id = project.id_project)`,
        'min_responsible_name',
      );
      idQb.orderBy(
        '"min_responsible_name"',
        sortOrder === 'DESC' ? 'DESC' : 'ASC',
      );
    } else {
      const SORTABLE_FIELDS = [
        'name_project',
        'status',
        'priority',
        'start_date',
        'due_date',
        'created_at',
        'updated_at',
        'manager_id',
        'sede_id',
        'id_project',
        'privacy_level',
      ] as const;

      if (
        sortBy &&
        (SORTABLE_FIELDS as ReadonlyArray<string>).includes(sortBy)
      ) {
        idQb.orderBy(
          'project.' + sortBy,
          sortOrder === 'DESC' ? 'DESC' : 'ASC',
        );
      } else {
        idQb.orderBy('project.created_at', 'DESC');
      }
    }

    const countQb = idQb.clone();
    countQb.select('COUNT(DISTINCT project.id_project)', 'cnt');
    countQb.skip(undefined);
    countQb.take(undefined);
    countQb.orderBy(); // ponytail: limpia ORDER BY para evitar conflicto con DISTINCT
    const total = Number((await countQb.getRawOne())?.cnt ?? 0);

    const idRows = await idQb
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: number }>();
    const ids = idRows.map((r) => Number(r.id));

    const data =
      ids.length > 0
        ? await this.repo.find({
            where: { id_project: In(ids) },
            relations: { responsibles: { user: true } },
          })
        : [];

    // ponytail: re-sort in-memory to preserve ORDER BY from idQb (find with IN doesn't guarantee order)
    const orderMap = new Map(ids.map((id, i) => [id, i]));
    data.sort(
      (a, b) =>
        (orderMap.get(a.id_project) ?? 0) - (orderMap.get(b.id_project) ?? 0),
    );

    const progressMap = await this.getProgressForProjects(
      data.map((p) => p.id_project),
    );
    for (const project of data) {
      project.progress = progressMap.get(project.id_project) ?? 0;
    }

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneById(id: number): Promise<ProjectEntity | null> {
    const project = await this.repo.findOne({
      where: { id_project: id },
      relations: { responsibles: { user: true } },
    });
    if (project) {
      const progressMap = await this.getProgressForProjects([id]);
      project.progress = progressMap.get(id) ?? 0;
    }
    return project;
  }

  async update(id: number, partial: Partial<ProjectEntity>): Promise<void> {
    await this.repo.update(id, partial);
  }

  async delete(project: ProjectEntity): Promise<void> {
    await this.repo.remove(project);
  }

  async isUserInSameArea(userId: number, managerId: number): Promise<boolean> {
    const sql =
      `SELECT 1 FROM ${DB_SCHEMA}.users u1 ` +
      `JOIN ${DB_SCHEMA}.users u2 ON u1.area_id = u2.area_id ` +
      `WHERE u1.id_user = $1 AND u2.id_user = $2`;
    const result: unknown[] = await this.repo.query(sql, [userId, managerId]);
    return result.length > 0;
  }

  async isUserInSede(userId: number, sedeId: number): Promise<boolean> {
    const sql =
      `SELECT 1 FROM ${DB_SCHEMA}.user_sedes ` +
      `WHERE user_id = $1 AND sede_id = $2`;
    const result: unknown[] = await this.repo.query(sql, [userId, sedeId]);
    return result.length > 0;
  }

  private async getProgressForProjects(
    projectIds: number[],
  ): Promise<Map<number, number>> {
    if (projectIds.length === 0) return new Map();
    const sql =
      `SELECT project_id, ` +
      `COALESCE(COUNT(*) FILTER (WHERE status = 4) * 100.0 / NULLIF(COUNT(*), 0), 0) AS progress ` +
      `FROM ${DB_SCHEMA}.tasks ` +
      `WHERE project_id = ANY($1) ` +
      `GROUP BY project_id`;
    const result: { project_id: number; progress: string }[] =
      await this.repo.query(sql, [projectIds]);
    const map = new Map<number, number>();
    for (const row of result) {
      map.set(row.project_id, Number(row.progress));
    }
    return map;
  }

  private applyPrivacyFilter(
    qb: SelectQueryBuilder<ProjectEntity>,
    userId: number,
  ): void {
    qb.leftJoin('project.manager', 'manager');

    const where =
      '(project.privacy_level = :pub ' +
      'OR (project.privacy_level = :priv AND project.manager_id = :userId) ' +
      'OR (project.privacy_level = :ment AND ( ' +
      'project.manager_id = :userId ' +
      'OR EXISTS ( ' +
      `SELECT 1 FROM ${DB_SCHEMA}.project_responsibles pr ` +
      `WHERE pr.project_id = project.id_project AND pr.user_id = :userId ` +
      `) ` +
      `)) ` +
      `OR (project.privacy_level = :area ` +
      `AND manager.area_id IS NOT NULL ` +
      `AND manager.area_id = ( ` +
      `SELECT u.area_id FROM ${DB_SCHEMA}.users u WHERE u.id_user = :userId ` +
      `)) ` +
      `OR (project.privacy_level = :sede ` +
      `AND EXISTS ( ` +
      `SELECT 1 FROM ${DB_SCHEMA}.user_sedes us ` +
      `WHERE us.user_id = :userId AND us.sede_id = project.sede_id ` +
      `) ` +
      `))`;

    qb.andWhere(where, {
      pub: PrivacyLevel.PUBLICO,
      priv: PrivacyLevel.PRIVADO,
      ment: PrivacyLevel.SOLO_MENCIONADOS,
      area: PrivacyLevel.SOLO_AREA,
      sede: PrivacyLevel.SOLO_SEDE,
      userId,
    });
  }
}
