import { Injectable, Inject } from '@nestjs/common';
import type { IRefreshTokenRepository } from '../repository/refresh-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../repository/refresh-token-repository.interface';

@Injectable()
export class RevokeTokensUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(userId: number): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }
}
