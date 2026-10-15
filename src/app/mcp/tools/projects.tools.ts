import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectsService } from '../../projects/projects.service';
import { QueryProjectDto } from '../../projects/dtos/query-project.dto';
import { jsonResult } from '../lib/format-tool-response';
import { paginationShape } from '../schemas/common.schema';
import { GetProjectsSummaryUseCase } from '../use-cases/get-projects-summary.use-case';

/** Dependencias que necesitan las tools de proyectos. */
export interface ProjectToolsDeps {
  projectsService: ProjectsService;
  getProjectsSummary: GetProjectsSummaryUseCase;
}

/** Registra las tools relacionadas con proyectos. */
export function registerProjectTools(
  server: McpServer,
  deps: ProjectToolsDeps,
): void {
  server.registerTool(
    'listar_proyectos',
    {
      title: 'Listar proyectos',
      description:
        'Lista proyectos con filtros opcionales, paginados. ' +
        'Estados: 0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado.',
      inputSchema: {
        status: z
          .array(z.number().int().min(0).max(4))
          .optional()
          .describe('Filtrar por uno o varios estados de proyecto'),
        search: z
          .string()
          .optional()
          .describe('Texto a buscar en el nombre del proyecto'),
        manager_id: z
          .string()
          .optional()
          .describe('UUID del manager (users.id_user)'),
        ...paginationShape,
      },
    },
    async ({ status, search, manager_id, page, limit }) => {
      const query = new QueryProjectDto();
      query.page = page;
      query.limit = limit;
      if (search) query.search = search;
      if (manager_id) query.manager_id = manager_id;
      if (status && status.length > 0) query.status = status.join(',');

      const result = await deps.projectsService.findAll(query);
      return jsonResult(result);
    },
  );

  server.registerTool(
    'detalle_proyecto',
    {
      title: 'Detalle de proyecto',
      description:
        'Devuelve un proyecto por su ID, incluyendo responsables y progreso.',
      inputSchema: {
        id: z.number().int().describe('ID del proyecto (id_project)'),
      },
    },
    async ({ id }) => jsonResult(await deps.projectsService.findOne(id)),
  );

  server.registerTool(
    'resumen_proyectos',
    {
      title: 'Resumen de proyectos',
      description: 'Totales de proyectos por estado y desglose por sede.',
      inputSchema: {},
    },
    async () => jsonResult(await deps.getProjectsSummary.execute()),
  );
}
