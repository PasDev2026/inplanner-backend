import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import { UserEntity } from '../entities/user.entity';
import { AreaEntity } from '../../areas/entities/area.entity';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepo.findByCredentials(
      dto.username,
      dto.email,
      dto.dni,
    );
    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException(
          `El username "${dto.username}" ya está en uso`,
        );
      }
      if (existing.email === dto.email) {
        throw new ConflictException(`El email "${dto.email}" ya está en uso`);
      }
      if (existing.dni === dto.dni) {
        throw new ConflictException(`El DNI "${dto.dni}" ya está registrado`);
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const { sede_ids, rol_ids, area_id, ...userData } = dto;

    const user = new UserEntity();
    Object.assign(user, userData);
    user.password = hashedPassword;

    if (area_id !== undefined) {
      const areaRef = new AreaEntity();
      areaRef.id_area = area_id;
      user.area = areaRef;
    }

    const saved = await this.userRepo.save(user);

    if (sede_ids && sede_ids.length > 0) {
      await this.userRepo.replaceSedes(saved.id_user, sede_ids);
    }
    if (rol_ids && rol_ids.length > 0) {
      await this.userRepo.replaceRoles(saved.id_user, rol_ids);
    }

    return this.userRepo.findByIdWithRelations(
      saved.id_user,
    ) as Promise<UserEntity>;
  }
}
