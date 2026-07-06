import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserRoleEntity } from '../../users/entities/user-role.entity';
import type { IRefreshTokenRepository } from '../repository/refresh-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../repository/refresh-token-repository.interface';
import type { JwtPayload } from '../interfaces/auth-types';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { resolveRoles } from '../helpers/role-resolver';

@Injectable()
export class RefreshUseCase {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const tokenRecord = await this.refreshTokenRepo.findWithUser(
      dto.refreshToken,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (tokenRecord.revoked) {
      throw new UnauthorizedException('Refresh token revocado');
    }
    if (
      tokenRecord.expiration_date &&
      tokenRecord.expiration_date < new Date()
    ) {
      await this.refreshTokenRepo.revokeById(tokenRecord.id);
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!tokenRecord.user.estado) {
      throw new UnauthorizedException(
        'Cuenta suspendida. Contacte al administrador.',
      );
    }

    const userRoles = await this.userRoleRepository.find({
      where: { user_id: tokenRecord.user.id_user },
    });

    const payload: JwtPayload = {
      sub: tokenRecord.user.id_user,
      username: tokenRecord.user.username,
      roles: resolveRoles(userRoles),
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    };
  }
}
