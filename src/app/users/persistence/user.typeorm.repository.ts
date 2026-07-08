import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserSedeEntity } from '../entities/user-sede.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import type {
  AvailableUser,
  IUsersRepository,
} from '../repository/user-repository.interface';
import { QueryUserDto } from '../dtos/query-user.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { AreaEntity } from '../../areas/entities/area.entity';

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
    const { page = 1, limit = 20, search, estado, area_id } = query;
    const skip = (page - 1) * limit;

    const baseWhere: FindOptionsWhere<UserEntity> = {};

    if (estado !== undefined) {
      baseWhere.estado = estado === 'true';
    }
    if (area_id !== undefined) {
      const areaRef = new AreaEntity();
      areaRef.id_area = area_id;
      baseWhere.area = areaRef;
    }

    let where: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[] =
      baseWhere;

    if (search) {
      const searchFields: (keyof Pick<
        UserEntity,
        'username' | 'name' | 'apellido_paterno' | 'apellido_materno' | 'email'
      >)[] = [
        'username',
        'name',
        'apellido_paterno',
        'apellido_materno',
        'email',
      ];
      where = searchFields.map((field) => ({
        ...baseWhere,
        [field]: ILike(`%${search}%`),
      }));
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { username: 'ASC' },
      relations: { userSedes: true, userRoles: true, area: true },
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
