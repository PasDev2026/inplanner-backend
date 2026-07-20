import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import { SocketService } from '../../../modules/socket/socket.service';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
    private readonly socketService: SocketService,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepo.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.userRepo.softDelete(id);

    await this.socketService.forceLogout(
      id,
      'Tu cuenta ha sido desactivada. Contacta al administrador.',
    );
  }
}
