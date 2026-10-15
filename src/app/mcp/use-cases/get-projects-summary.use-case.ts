import { Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type GeneralMetrics,
  type IMcpRepository,
  type ProjectSedeRow,
} from '../repository/mcp-repository.interface';

export interface ProjectsSummary {
  por_estado: GeneralMetrics['proyectos'];
  por_sede: ProjectSedeRow[];
}

/** Resumen de proyectos: totales por estado y desglose por sede. */
@Injectable()
export class GetProjectsSummaryUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  async execute(): Promise<ProjectsSummary> {
    const [metrics, porSede] = await Promise.all([
      this.repository.getGeneralMetrics(),
      this.repository.getProjectsBySede(),
    ]);
    return { por_estado: metrics.proyectos, por_sede: porSede };
  }
}
