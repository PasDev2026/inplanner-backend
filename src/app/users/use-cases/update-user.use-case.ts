import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import { UserEntity } from '../entities/user.entity';
import { AreaEntity } from '../../areas/entities/area.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { SocketService } from '../../../modules/socket/socket.service';
import { TrabajadoresCentralizadoService } from '../../../libs/services/trabajadores-centralizado.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
    private readonly socketService: SocketService,
    private readonly trabajadores: TrabajadoresCentralizadoService,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    bearerToken = '',
  ): Promise<UserEntity> {
    const user = await this.userRepo.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const wasActive = user.estado;
    const isBeingDeactivated = dto.estado === false && wasActive;

    if (dto.asignaciones?.length) {
      const sedeIds = dto.asignaciones.map(
        (asignacion) => asignacion.sede_uuid,
      );
      if (new Set(sedeIds).size !== sedeIds.length) {
        throw new BadRequestException('Cada sede solo puede tener un rol');
      }

      await this.trabajadores.updateTrabajador(
        id,
        dto.asignaciones.map((asignacion) => ({
          sede_uuid: asignacion.sede_uuid,
          rol_uuid: asignacion.rol_uuid,
          especialidad_uuids: asignacion.especialidad_uuids ?? [],
        })),
        bearerToken,
      );
      user.sede_id = dto.asignaciones[0].sede_uuid;
    }

    if (dto.area_id !== undefined) {
      const areaRef = new AreaEntity();
      areaRef.id_area = dto.area_id;
      user.area = areaRef;
    }
    if (dto.estado !== undefined) {
      user.estado = dto.estado;
    }

    await this.userRepo.save(user);

    if (isBeingDeactivated) {
      await this.socketService.forceLogout(
        id,
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
      );
    }

    return (await this.userRepo.findByIdWithRelations(id)) ?? user;
  }
}
