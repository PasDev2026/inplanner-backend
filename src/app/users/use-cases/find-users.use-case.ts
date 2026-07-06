import { Injectable, Inject } from '@nestjs/common';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import type { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { UserEntity } from '../entities/user.entity';
import { QueryUserDto } from '../dtos/query-user.dto';

@Injectable()
export class FindUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
  ) {}

  async execute(query: QueryUserDto): Promise<PaginatedResult<UserEntity>> {
    return this.userRepo.findWithPagination(query);
  }
}
