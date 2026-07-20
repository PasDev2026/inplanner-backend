import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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

  async execute(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepo.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const wasActive = user.estado;
    const isBeingDeactivated = dto.estado === false && wasActive;

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
