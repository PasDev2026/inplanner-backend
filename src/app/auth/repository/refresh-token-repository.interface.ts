import { InjectionToken } from '@nestjs/common';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY =
  'REFRESH_TOKEN_REPOSITORY' as InjectionToken;

export interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshTokenEntity | null>;
  findWithUser(token: string): Promise<RefreshTokenEntity | null>;
  save(data: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity>;
  revokeById(id: number): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}
