import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import type { IRefreshTokenRepository } from '../repository/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenTypeormRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({ where: { token } });
  }

  async findWithUser(token: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({
      where: { token },
      relations: { user: true },
    });
  }

  async save(data: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity> {
    return this.repo.save(data as RefreshTokenEntity);
  }

  async revokeById(id: number): Promise<void> {
    await this.repo.update(id, { revoked: true });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.repo.update(
      { user_id: userId, revoked: false },
      { revoked: true },
    );
  }
}
