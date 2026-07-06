import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import { UserEntity } from '../entities/user.entity';
import { AreaEntity } from '../../areas/entities/area.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { SocketService } from '../../../modules/socket/socket.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
    private readonly socketService: SocketService,
  ) {}

  async execute(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepo.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const wasActive = user.estado;
    const isBeingDeactivated = dto.estado === false && wasActive;

    if (dto.username || dto.email || dto.dni) {
      const existing = await this.userRepo.findByCredentials(
        dto.username ?? user.username,
        dto.email ?? user.email,
        dto.dni ?? user.dni,
      );
      if (existing && existing.id_user !== id) {
        if (existing.username === (dto.username ?? user.username)) {
          throw new ConflictException(
            `El username "${dto.username ?? user.username}" ya está en uso`,
          );
        }
        if (existing.email === (dto.email ?? user.email)) {
          throw new ConflictException(
            `El email "${dto.email ?? user.email}" ya está en uso`,
          );
        }
        if (existing.dni === (dto.dni ?? user.dni)) {
          throw new ConflictException(
            `El DNI "${dto.dni ?? user.dni}" ya está registrado`,
          );
        }
      }
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

    await this.userRepo.save(user);

    if (sede_ids !== undefined) {
      await this.userRepo.replaceSedes(id, sede_ids);
    }
    if (rol_ids !== undefined) {
      await this.userRepo.replaceRoles(id, rol_ids);
    }

    if (isBeingDeactivated) {
      await this.socketService.forceLogout(
        id,
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
      );
    }

    return (await this.userRepo.findByIdWithRelations(id)) ?? user;
  }
}
