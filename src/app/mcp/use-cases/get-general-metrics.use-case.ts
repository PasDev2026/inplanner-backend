import { Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type GeneralMetrics,
  type IMcpRepository,
} from '../repository/mcp-repository.interface';

/** Métricas generales del sistema (totales de proyectos y tareas por estado). */
@Injectable()
export class GetGeneralMetricsUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  execute(): Promise<GeneralMetrics> {
    return this.repository.getGeneralMetrics();
  }
}
