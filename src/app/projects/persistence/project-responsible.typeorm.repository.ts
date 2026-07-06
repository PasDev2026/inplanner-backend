import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectResponsibleEntity } from '../entities/project-responsible.entity';
import { CreateProjectResponsibleDto } from '../dtos/create-project-responsible.dto';
import { IProjectResponsibleRepository } from '../repository/project-responsible-repository.interface';

@Injectable()
export class ProjectResponsibleTypeormRepository implements IProjectResponsibleRepository {
  constructor(
    @InjectRepository(ProjectResponsibleEntity)
    private readonly repo: Repository<ProjectResponsibleEntity>,
  ) {}

  async findOneByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<ProjectResponsibleEntity | null> {
    return this.repo.findOne({
      where: { project_id: projectId, user_id: userId },
    });
  }

  async create(
    dto: CreateProjectResponsibleDto,
  ): Promise<ProjectResponsibleEntity> {
    const responsible = this.repo.create(dto);
    return this.repo.save(responsible);
  }

  async findByProjectId(
    projectId: number,
  ): Promise<ProjectResponsibleEntity[]> {
    return this.repo.find({
      where: { project_id: projectId },
      relations: { user: true },
    });
  }

  async delete(responsible: ProjectResponsibleEntity): Promise<void> {
    await this.repo.remove(responsible);
  }

  async countByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<number> {
    return this.repo.count({
      where: { project_id: projectId, user_id: userId },
    });
  }
}
