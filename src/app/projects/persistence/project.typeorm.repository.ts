import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('project');

    qb.leftJoinAndSelect('project.responsibles', 'responsibles');
    qb.leftJoinAndSelect('responsibles.user', 'responsibleUser');

    if (search) {
      qb.andWhere('project.name_project ILIKE :search', {
        search: '%' + search + '%',
      });
    }
    if (status !== undefined) {
      qb.andWhere('project.status = :status', { status });
    }
    if (priority !== undefined) {
      qb.andWhere('project.priority = :priority', { priority });
    }
    if (sede_id !== undefined) {
      qb.andWhere('project.sede_id = :sedeId', { sedeId: sede_id });
    }
    if (manager_id !== undefined) {
      qb.andWhere('project.manager_id = :managerId', { managerId: manager_id });
    }
    if (dateFrom && dateTo) {
      qb.andWhere('project.start_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });
    } else if (dateFrom) {
      qb.andWhere('project.start_date >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    } else if (dateTo) {
      qb.andWhere('project.start_date <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    if (user && !user.roles.includes(Role.SUPER_ADMIN)) {
      this.applyPrivacyFilter(qb, user.sub);
    }

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

    if (sortBy && (SORTABLE_FIELDS as ReadonlyArray<string>).includes(sortBy)) {
      qb.orderBy('project.' + sortBy, sortOrder === 'DESC' ? 'DESC' : 'ASC');
    } else {
      qb.orderBy('project.created_at', 'DESC');
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneById(id: number): Promise<ProjectEntity | null> {
    return this.repo.findOne({
      where: { id_project: id },
      relations: { responsibles: { user: true } },
    });
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
