import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { AreasService } from '../areas/areas.service';
import { NotesService } from '../notes/notes.service';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './constants/mcp.constants';
import { registerAreaTools } from './tools/areas.tools';
import { registerExportTools } from './tools/export.tools';
import { registerMetricsTools } from './tools/metrics.tools';
import { registerNoteTools } from './tools/notes.tools';
import { registerProjectTools } from './tools/projects.tools';
import { registerSystemTools } from './tools/system.tools';
import { registerTaskTools } from './tools/tasks.tools';
import { registerUserTools } from './tools/users.tools';
import { GetAreaDetailUseCase } from './use-cases/get-area-detail.use-case';
import { GetAreaPerformanceUseCase } from './use-cases/get-area-performance.use-case';
import { ExportDatasetUseCase } from './use-cases/export-dataset.use-case';
import { GetGeneralMetricsUseCase } from './use-cases/get-general-metrics.use-case';
import { GetOverdueTasksUseCase } from './use-cases/get-overdue-tasks.use-case';
import { GetProjectsSummaryUseCase } from './use-cases/get-projects-summary.use-case';
import { GetUserActivityUseCase } from './use-cases/get-user-activity.use-case';
import { GetUserLoadUseCase } from './use-cases/get-user-load.use-case';

/**
 * Construye una instancia de `McpServer` con todas las tools registradas
 * y las dependencias inyectadas desde Nest.
 *
 * En modo stateless se crea una instancia por petición; es barato y evita
 * tener que gestionar sesiones.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
    private readonly areasService: AreasService,
    private readonly notesService: NotesService,
    private readonly getProjectsSummary: GetProjectsSummaryUseCase,
    private readonly getUserActivity: GetUserActivityUseCase,
    private readonly getUserLoad: GetUserLoadUseCase,
    private readonly getOverdueTasks: GetOverdueTasksUseCase,
    private readonly getAreaPerformance: GetAreaPerformanceUseCase,
    private readonly getAreaDetail: GetAreaDetailUseCase,
    private readonly getGeneralMetrics: GetGeneralMetricsUseCase,
    private readonly exportDataset: ExportDatasetUseCase,
  ) {}

  create(): McpServer {
    const server = new McpServer(
      { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      {
        instructions:
          'Servidor de consulta de solo lectura de Inplanner. Usa describir_sistema ' +
          'para conocer entidades y estados antes de consultar.',
      },
    );

    registerSystemTools(server);
    registerProjectTools(server, {
      projectsService: this.projectsService,
      getProjectsSummary: this.getProjectsSummary,
    });
    registerTaskTools(server, {
      tasksService: this.tasksService,
      getUserActivity: this.getUserActivity,
      getUserLoad: this.getUserLoad,
      getOverdueTasks: this.getOverdueTasks,
    });
    registerUserTools(server, { usersService: this.usersService });
    registerAreaTools(server, { areasService: this.areasService });
    registerNoteTools(server, { notesService: this.notesService });
    registerMetricsTools(server, {
      getAreaPerformance: this.getAreaPerformance,
      getAreaDetail: this.getAreaDetail,
      getGeneralMetrics: this.getGeneralMetrics,
    });
    registerExportTools(server, { exportDataset: this.exportDataset });

    return server;
  }
}
