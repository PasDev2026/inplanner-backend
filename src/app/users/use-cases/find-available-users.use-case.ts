import { Injectable, Inject } from '@nestjs/common';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import type {
  AvailableUser,
  IUsersRepository,
} from '../repository/user-repository.interface';

@Injectable()
export class FindAvailableUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
  ) {}

  async execute(): Promise<AvailableUser[]> {
    return this.userRepo.findAvailable();
  }
}
