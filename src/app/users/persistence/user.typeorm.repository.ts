import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserSedeEntity } from '../entities/user-sede.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
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
    @InjectRepository(UserSedeEntity)
    private readonly sedeRepo: Repository<UserSedeEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly roleRepo: Repository<UserRoleEntity>,
  ) {}

  async save(user: UserEntity): Promise<UserEntity> {
    return this.repo.save(user);
  }

  async findWithPagination(
    query: QueryUserDto,
  ): Promise<PaginatedResult<UserEntity>> {
    const {
      page = 1,
      limit = 20,
      search,
      estado,
      area_id,
      rol_id,
      sede_id,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userSedes', 'userSedes')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('user.area', 'area');

    if (search) {
      qb.andWhere(
        '(user.username ILIKE :search OR user.name ILIKE :search OR user.apellido_paterno ILIKE :search OR user.apellido_materno ILIKE :search OR user.email ILIKE :search)',
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
    if (rol_id) {
      const rolIds = rol_id.split(',').map(Number);
      qb.andWhere('userRoles.rol_id IN (:...rolIds)', { rolIds });
    }
    if (sede_id) {
      const sedeIds = sede_id.split(',').map(Number);
      qb.andWhere('userSedes.sede_id IN (:...sedeIds)', { sedeIds });
    }

    qb.orderBy('user.username', 'ASC');
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

  async findByIdWithRelations(id: number): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { id_user: id },
      relations: { userSedes: true, userRoles: true, area: true },
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.update(id, { estado: false });
  }

  async findByCredentials(
    username: string,
    email: string,
    dni: string,
  ): Promise<UserEntity | null> {
    const where: FindOptionsWhere<UserEntity>[] = [
      { username },
      { email },
      { dni },
    ];
    return this.repo.findOne({ where });
  }

  async replaceSedes(userId: number, sedeIds: number[]): Promise<void> {
    await this.sedeRepo.delete({ user_id: userId });
    if (sedeIds.length > 0) {
      await this.sedeRepo.save(
        sedeIds.map((sede_id) =>
          this.sedeRepo.create({ user_id: userId, sede_id }),
        ),
      );
    }
  }

  async replaceRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.roleRepo.delete({ user_id: userId });
    if (roleIds.length > 0) {
      await this.roleRepo.save(
        roleIds.map((rol_id) =>
          this.roleRepo.create({ user_id: userId, rol_id }),
        ),
      );
    }
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
