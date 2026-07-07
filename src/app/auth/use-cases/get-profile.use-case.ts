import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import type { UserProfile } from '../interfaces/auth-types';
import { resolveRoles, buildFullName } from '../helpers/role-resolver';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async execute(userId: number): Promise<{ user: UserProfile }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
      relations: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (!user.estado) {
      throw new UnauthorizedException('Cuenta suspendida');
    }

    const fullName = buildFullName(user);
    const roles = resolveRoles(user.userRoles);

    return {
      user: {
        idUser: user.id_user,
        username: user.username,
        email: user.email,
        name: user.name,
        apellido_paterno: user.apellido_paterno ?? '',
        dni: user.dni,
        fullName,
        roles,
      },
    };
  }
}
