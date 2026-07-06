import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AreaEntity } from '../entities/area.entity';
import type { IAreaRepository } from '../repository/area-repository.interface';
import { QueryAreaDto } from '../dtos/query-area.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class AreaTypeormRepository implements IAreaRepository {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly repo: Repository<AreaEntity>,
  ) {}

  async save(area: AreaEntity): Promise<AreaEntity> {
    return this.repo.save(area);
  }

  async findWithPagination(
    query: QueryAreaDto,
  ): Promise<PaginatedResult<AreaEntity>> {
    const { page = 1, limit = 20, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AreaEntity> = {};

    if (search) {
      where.nombre_area = ILike('%' + search + '%');
    }
    if (estado !== undefined) {
      where.estado = estado === 'true';
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { nombre_area: 'ASC' },
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneById(id: number): Promise<AreaEntity | null> {
    return this.repo.findOne({ where: { id_area: id } });
  }

  async findByName(name: string): Promise<AreaEntity | null> {
    return this.repo.findOne({ where: { nombre_area: name } });
  }
}
