import { Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type IMcpRepository,
  type UserLoadRow,
} from '../repository/mcp-repository.interface';

/** Carga de trabajo por usuario (tareas asignadas y su estado). */
@Injectable()
export class GetUserLoadUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
  ) {}

  execute(): Promise<UserLoadRow[]> {
    return this.repository.getUserLoad();
  }
}
