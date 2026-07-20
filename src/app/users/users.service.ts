import { Injectable } from '@nestjs/common';
import { FindUsersUseCase } from './use-cases/find-users.use-case';
import { FindUserUseCase } from './use-cases/find-user.use-case';
import { FindAvailableUsersUseCase } from './use-cases/find-available-users.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { UpdateUserDto } from './dtos/update-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { UserEntity } from './entities/user.entity';
import { AvailableUser } from './repository/user-repository.interface';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly findUsersUseCase: FindUsersUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly findAvailableUsersUseCase: FindAvailableUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async findAll(query: QueryUserDto): Promise<PaginatedResult<UserEntity>> {
    return this.findUsersUseCase.execute(query);
  }

  async findAvailable(): Promise<AvailableUser[]> {
    return this.findAvailableUsersUseCase.execute();
  }

  async findOne(id: string): Promise<UserEntity> {
    return this.findUserUseCase.execute(id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    return this.updateUserUseCase.execute(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
