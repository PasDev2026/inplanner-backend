import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindUsersUseCase } from './use-cases/find-users.use-case';
import { FindUserUseCase } from './use-cases/find-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { UserEntity } from './entities/user.entity';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUsersUseCase: FindUsersUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    return this.createUserUseCase.execute(dto);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<UserEntity>> {
    return this.findUsersUseCase.execute(query);
  }

  async findOne(id: number): Promise<UserEntity> {
    return this.findUserUseCase.execute(id);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    return this.updateUserUseCase.execute(id, dto);
  }

  async remove(id: number): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
