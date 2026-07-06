import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { IRefreshTokenRepository } from '../repository/refresh-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../repository/refresh-token-repository.interface';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<{ message: string }> {
    const token = await this.refreshTokenRepo.findByToken(dto.refreshToken);

    if (!token) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.refreshTokenRepo.revokeById(token.id);

    return { message: 'Sesión cerrada exitosamente' };
  }
}
