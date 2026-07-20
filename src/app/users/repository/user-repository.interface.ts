import { InjectionToken } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { QueryUserDto } from '../dtos/query-user.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

export const USERS_REPOSITORY = 'USERS_REPOSITORY' as InjectionToken;

export type AvailableUser = Pick<
  UserEntity,
  'id_user' | 'name' | 'apellido_paterno' | 'apellido_materno'
>;

export interface IUsersRepository {
  save(user: UserEntity): Promise<UserEntity>;
  findWithPagination(query: QueryUserDto): Promise<PaginatedResult<UserEntity>>;
  findByIdWithRelations(id: string): Promise<UserEntity | null>;
  softDelete(id: string): Promise<void>;
  findAvailable(): Promise<AvailableUser[]>;
}
