import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { NotesModule } from '../notes/notes.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';
import { McpAuthGuard } from './guards/mcp-auth.guard';
import { McpAuditService } from './audit/mcp-audit.service';
import { MCP_REPOSITORY } from './repository/mcp-repository.interface';
import { McpTypeormRepository } from './persistence/mcp.typeorm.repository';
import { ExportDatasetUseCase } from './use-cases/export-dataset.use-case';
import { GetAreaDetailUseCase } from './use-cases/get-area-detail.use-case';
import { GetAreaPerformanceUseCase } from './use-cases/get-area-performance.use-case';
import { GetGeneralMetricsUseCase } from './use-cases/get-general-metrics.use-case';
import { GetOverdueTasksUseCase } from './use-cases/get-overdue-tasks.use-case';
import { GetProjectsSummaryUseCase } from './use-cases/get-projects-summary.use-case';
import { GetUserActivityUseCase } from './use-cases/get-user-activity.use-case';
import { GetUserLoadUseCase } from './use-cases/get-user-load.use-case';

/**
 * Módulo MCP de Inplanner (solo lectura).
 *
 * Expone el endpoint `/api/v1/mcp` con las tools de consulta. Las tools se
 * registran dentro de `McpServerFactory`. Las consultas propias viven en
 * `McpTypeormRepository`.
 */
@Module({
  imports: [ProjectsModule, TasksModule, UsersModule, AreasModule, NotesModule],
  controllers: [McpController],
  providers: [
    { provide: MCP_REPOSITORY, useClass: McpTypeormRepository },
    McpServerFactory,
    McpAuthGuard,
    McpAuditService,
    GetAreaPerformanceUseCase,
    GetAreaDetailUseCase,
    GetGeneralMetricsUseCase,
    GetProjectsSummaryUseCase,
    GetUserActivityUseCase,
    GetUserLoadUseCase,
    GetOverdueTasksUseCase,
    ExportDatasetUseCase,
  ],
})
export class McpModule {}
