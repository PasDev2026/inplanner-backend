import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type IMcpRepository,
  type UserActivity,
} from '../repository/mcp-repository.interface';

/**
 * Actividad de un usuario en un rango de fechas (por defecto, hoy).
 * Refleja lo que el sistema **registra** (no necesariamente lo que la persona hizo).
 */
@Injectable()
export class GetUserActivityUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  execute(
    userId: string,
    desde?: string,
    hasta?: string,
  ): Promise<UserActivity> {
    const to = this.parseDate(hasta) ?? new Date();
    const from = this.parseDate(desde) ?? to;

    if (from > to) {
      throw new BadRequestException('El rango de fechas es inválido');
    }
    return this.repository.getUserActivity(userId, from, to);
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
