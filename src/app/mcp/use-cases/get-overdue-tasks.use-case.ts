import { Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type IMcpRepository,
  type OverdueTaskRow,
} from '../repository/mcp-repository.interface';

/** Tareas vencidas (fecha límite pasada y sin completar). */
@Injectable()
export class GetOverdueTasksUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  execute(
    minDiasVencida?: number,
    projectId?: number,
  ): Promise<OverdueTaskRow[]> {
    return this.repository.getOverdueTasks(minDiasVencida, projectId);
  }
}
