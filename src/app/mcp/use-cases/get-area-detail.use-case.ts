import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type AreaDetail,
  type IMcpRepository,
} from '../repository/mcp-repository.interface';

/** Detalle de un área: datos, usuarios y proyectos con progreso. */
@Injectable()
export class GetAreaDetailUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  async execute(areaId: number): Promise<AreaDetail> {
    const area = await this.repository.getAreaDetail(areaId);
    if (!area) {
      throw new NotFoundException(`Área ${areaId} no encontrada`);
    }
    return area;
  }
}
