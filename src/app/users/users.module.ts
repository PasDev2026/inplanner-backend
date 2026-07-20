import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { USERS_REPOSITORY } from './repository/user-repository.interface';
import { UserTypeormRepository } from './persistence/user.typeorm.repository';
import { FindUsersUseCase } from './use-cases/find-users.use-case';
import { FindUserUseCase } from './use-cases/find-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { FindAvailableUsersUseCase } from './use-cases/find-available-users.use-case';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: UserTypeormRepository },
    FindUsersUseCase,
    FindUserUseCase,
    FindAvailableUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    UsersService,
  ],
  exports: [TypeOrmModule],
})
export class UsersModule {}
