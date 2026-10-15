import { Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type AreaPerformanceRow,
  type IMcpRepository,
} from '../repository/mcp-repository.interface';

/**
 * Rendimiento de áreas (ranking o comparación de un subconjunto).
 * La atribución de proyectos/tareas al área es la misma que usa el dashboard.
 */
@Injectable()
export class GetAreaPerformanceUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  execute(areaIds?: number[]): Promise<AreaPerformanceRow[]> {
    return this.repository.getAreaPerformance(areaIds);
  }
}
