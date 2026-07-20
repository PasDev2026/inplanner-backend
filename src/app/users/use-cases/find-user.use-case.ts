import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
  ) {}

  async execute(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }
}
