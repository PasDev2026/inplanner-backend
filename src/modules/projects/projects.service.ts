import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectResponsibleEntity } from './project-responsible.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectResponsibleDto } from './dto/create-project-responsible.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectResponsibleEntity)
    private readonly responsibleRepository: Repository<ProjectResponsibleEntity>,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectEntity> {
    const project = this.projectRepository.create(dto as any) as unknown as ProjectEntity;
    return this.projectRepository.save(project);
  }

  async findAll(query: QueryProjectDto): Promise<PaginatedResult<ProjectEntity>> {
    const { page = 1, limit = 20, search, status, priority, sede_id, manager_id, dateFrom, dateTo, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProjectEntity> = {};

    if (search) {
      where.name_project = ILike(`%${search}%`);
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (priority !== undefined) {
      where.priority = priority;
    }
    if (sede_id !== undefined) {
      where.sede_id = sede_id;
    }
    if (manager_id !== undefined) {
      where.manager_id = manager_id;
    }
    if (dateFrom && dateTo) {
      where.start_date = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.start_date = MoreThanOrEqual(new Date(dateFrom));
    } else if (dateTo) {
      where.start_date = LessThanOrEqual(new Date(dateTo));
    }

    const SORTABLE_FIELDS = ['name_project', 'status', 'priority', 'start_date', 'due_date', 'created_at', 'updated_at', 'manager_id', 'sede_id', 'id_project'] as const;
    type SortableField = (typeof SORTABLE_FIELDS)[number];

    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sortBy && (SORTABLE_FIELDS as ReadonlyArray<string>).includes(sortBy)) {
      order[sortBy] = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    } else {
      order.created_at = 'DESC';
    }

    const [data, total] = await this.projectRepository.findAndCount({
      where,
      skip,
      take: limit,
      order,
      relations: { responsibles: true },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { id_project: id }, relations: { responsibles: true } });
    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }
    return project;
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async createResponsible(dto: CreateProjectResponsibleDto): Promise<ProjectResponsibleEntity> {
    const existing = await this.responsibleRepository.findOne({
      where: { project_id: dto.project_id, user_id: dto.user_id },
    });

    if (existing) {
      throw new ConflictException('El usuario ya es responsable de este proyecto');
    }

    const responsible = this.responsibleRepository.create(dto);
    return this.responsibleRepository.save(responsible);
  }

  async findResponsibles(projectId: number): Promise<ProjectResponsibleEntity[]> {
    return this.responsibleRepository.find({
      where: { project_id: projectId },
      relations: { user: true },
    });
  }

  async removeResponsible(projectId: number, userId: number): Promise<void> {
    const responsible = await this.responsibleRepository.findOne({
      where: { project_id: projectId, user_id: userId },
    });

    if (!responsible) {
      throw new NotFoundException('Responsable no encontrado');
    }

    await this.responsibleRepository.remove(responsible);
  }
}
