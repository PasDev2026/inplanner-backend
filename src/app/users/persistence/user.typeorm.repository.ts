import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import type {
  AvailableUser,
  IUsersRepository,
} from '../repository/user-repository.interface';
import { QueryUserDto } from '../dtos/query-user.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class UserTypeormRepository implements IUsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async save(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async findWithPagination(
    query: QueryUserDto,
  ): Promise<PaginatedResult<UserEntity>> {
    const { page = 1, limit = 20, search, estado, area_id, sede_id } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.area', 'area');

    if (search) {
      qb.andWhere(
        '(user.name ILIKE :search OR user.apellido_paterno ILIKE :search OR user.apellido_materno ILIKE :search OR user.email ILIKE :search OR user.numero_documento ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (estado !== undefined) {
      qb.andWhere('user.estado = :estado', { estado: estado === 'true' });
    }
    if (area_id) {
      const areaIds = area_id.split(',').map(Number);
      qb.andWhere('area.id_area IN (:...areaIds)', { areaIds });
    }
    if (sede_id) {
      const sedeIds = sede_id.split(',');
      qb.andWhere('user.sede_id IN (:...sedeIds)', { sedeIds });
    }

    qb.orderBy('user.name', 'ASC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async findByIdWithRelations(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { id_user: id },
      relations: { area: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.update(id, { estado: false });
  }

  async findAvailable(): Promise<AvailableUser[]> {
    return this.repo.find({
      select: {
        id_user: true,
        name: true,
        apellido_paterno: true,
        apellido_materno: true,
      },
      order: { name: 'ASC' },
    });
  }
}
