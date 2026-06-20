import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { UserSedeEntity } from './user-sede.entity';
import { UserRoleEntity } from './user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { SocketService } from '../socket/socket.service';
import { AreaEntity } from '../areas/area.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSedeEntity)
    private readonly userSedeRepository: Repository<UserSedeEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    private readonly socketService: SocketService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    await this.checkUniqueness(dto.username, dto.email, dto.dni);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { sede_ids, rol_ids, area_id, ...userData } = dto;
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    if (area_id !== undefined) {
      const areaRef = new AreaEntity();
      areaRef.id_area = area_id;
      user.area = areaRef;
    }

    const saved = await this.userRepository.save(user);

    if (sede_ids && sede_ids.length > 0) {
      await this.userSedeRepository.save(
        sede_ids.map((sede_id) =>
          this.userSedeRepository.create({ user_id: saved.id_user, sede_id }),
        ),
      );
    }
    if (rol_ids && rol_ids.length > 0) {
      await this.userRoleRepository.save(
        rol_ids.map((rol_id) =>
          this.userRoleRepository.create({ user_id: saved.id_user, rol_id }),
        ),
      );
    }

    const savedUser = await this.userRepository.findOne({
      where: { id_user: saved.id_user },
      relations: { userSedes: true, userRoles: true, area: true },
    });
    return savedUser!;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<UserEntity>> {
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

    const [data, total] = await this.userRepository.findAndCount({
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

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id_user: id },
      relations: { userSedes: true, userRoles: true, area: true },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    const wasActive = user.estado;
    const isBeingDeactivated = dto.estado === false && wasActive;

    if (dto.username || dto.email || dto.dni) {
      await this.checkUniqueness(
        dto.username ?? user.username,
        dto.email ?? user.email,
        dto.dni ?? user.dni,
        id,
      );
    }

    const { sede_ids, rol_ids, area_id, ...updateFields } = dto;

    if (updateFields.password) {
      updateFields.password = await bcrypt.hash(updateFields.password, 10);
    }

    Object.assign(user, updateFields);

    if (area_id !== undefined) {
      const areaRef = new AreaEntity();
      areaRef.id_area = area_id;
      user.area = areaRef;
    }

    await this.userRepository.save(user);

    if (sede_ids !== undefined) {
      await this.userSedeRepository.delete({ user_id: id });
      if (sede_ids.length > 0) {
        await this.userSedeRepository.save(
          sede_ids.map((sede_id) =>
            this.userSedeRepository.create({ user_id: id, sede_id }),
          ),
        );
      }
    }

    if (rol_ids !== undefined) {
      await this.userRoleRepository.delete({ user_id: id });
      if (rol_ids.length > 0) {
        await this.userRoleRepository.save(
          rol_ids.map((rol_id) =>
            this.userRoleRepository.create({ user_id: id, rol_id }),
          ),
        );
      }
    }

    if (isBeingDeactivated) {
      await this.socketService.forceLogout(
        id,
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
      );
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id_user: id },
      relations: { userSedes: true, userRoles: true, area: true },
    });
    return updatedUser!;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.estado = false;
    await this.userRepository.save(user);

    await this.socketService.forceLogout(
      id,
      'Tu cuenta ha sido desactivada. Contacta al administrador.',
    );
  }

  private async checkUniqueness(
    username: string,
    email: string,
    dni: string,
    excludeId?: number,
  ): Promise<void> {
    const where: FindOptionsWhere<UserEntity>[] = [
      { username },
      { email },
      { dni },
    ];

    const existing = await this.userRepository.findOne({ where });

    if (existing && existing.id_user !== excludeId) {
      if (existing.username === username) {
        throw new ConflictException(`El username "${username}" ya está en uso`);
      }
      if (existing.email === email) {
        throw new ConflictException(`El email "${email}" ya está en uso`);
      }
      if (existing.dni === dni) {
        throw new ConflictException(`El DNI "${dni}" ya está registrado`);
      }
    }
  }
}
