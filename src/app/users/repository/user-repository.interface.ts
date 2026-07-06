import { InjectionToken } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { QueryUserDto } from '../dtos/query-user.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

export const USERS_REPOSITORY = 'USERS_REPOSITORY' as InjectionToken;

export interface IUsersRepository {
  save(user: UserEntity): Promise<UserEntity>;
  findWithPagination(query: QueryUserDto): Promise<PaginatedResult<UserEntity>>;
  findByIdWithRelations(id: number): Promise<UserEntity | null>;
  softDelete(id: number): Promise<void>;
  findByCredentials(
    username: string,
    email: string,
    dni: string,
  ): Promise<UserEntity | null>;
  replaceSedes(userId: number, sedeIds: number[]): Promise<void>;
  replaceRoles(userId: number, roleIds: number[]): Promise<void>;
}
