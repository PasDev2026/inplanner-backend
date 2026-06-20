import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AreaEntity } from './area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { QueryAreaDto } from './dto/query-area.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly areaRepository: Repository<AreaEntity>,
  ) {}

  async create(dto: CreateAreaDto): Promise<AreaEntity> {
    const existing = await this.areaRepository.findOne({
      where: { nombre_area: dto.nombre_area },
    });

    if (existing) {
      throw new ConflictException(`El área "${dto.nombre_area}" ya existe`);
    }

    const area = this.areaRepository.create(dto);
    return this.areaRepository.save(area);
  }

  async findAll(query: QueryAreaDto): Promise<PaginatedResult<AreaEntity>> {
    const { page = 1, limit = 20, search, estado } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AreaEntity> = {};

    if (search) {
      where.nombre_area = ILike(`%${search}%`);
    }
    if (estado !== undefined) {
      where.estado = estado === 'true';
    }

    const [data, total] = await this.areaRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { nombre_area: 'ASC' },
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

  async findOne(id: number): Promise<AreaEntity> {
    const area = await this.areaRepository.findOne({ where: { id_area: id } });
    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }
    return area;
  }

  async update(id: number, dto: UpdateAreaDto): Promise<AreaEntity> {
    const area = await this.findOne(id);

    if (dto.nombre_area && dto.nombre_area !== area.nombre_area) {
      const existing = await this.areaRepository.findOne({
        where: { nombre_area: dto.nombre_area },
      });
      if (existing) {
        throw new ConflictException(`El área "${dto.nombre_area}" ya existe`);
      }
    }

    Object.assign(area, dto);
    return this.areaRepository.save(area);
  }

  async remove(id: number): Promise<void> {
    const area = await this.findOne(id);
    area.estado = false;
    await this.areaRepository.save(area);
  }
}
