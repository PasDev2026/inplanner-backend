import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../users/entities/user.entity';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import type { IRefreshTokenRepository } from '../repository/refresh-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../repository/refresh-token-repository.interface';
import type { JwtPayload, LoginResponse } from '../interfaces/auth-types';
import { LoginDto } from '../dtos/login.dto';
import { resolveRoles, buildFullName } from '../helpers/role-resolver';

@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(loginDto: LoginDto): Promise<LoginResponse> {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { username },
      relations: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Password incorrecto');
    }

    if (!user.estado) {
      throw new UnauthorizedException('Cuenta suspendida');
    }

    const fullName = buildFullName(user);
    const roles = resolveRoles(user.userRoles);

    const payload: JwtPayload = {
      sub: user.id_user,
      username: user.username,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id_user);

    return {
      user: {
        idUser: user.id_user,
        username: user.username,
        email: user.email,
        name: user.name,
        apellido_paterno: user.apellido_paterno ?? '',
        fullName,
        roles,
      },
      accessToken,
      refreshToken,
    };
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 14);

    await this.refreshTokenRepo.revokeAllForUser(userId);
    await this.refreshTokenRepo.save({
      token,
      user_id: userId,
      expiration_date: expiresAt,
      revoked: false,
    });

    return token;
  }
}
