import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AreasService } from '../../areas/areas.service';
import { QueryAreaDto } from '../../areas/dtos/query-area.dto';
import { jsonResult } from '../lib/format-tool-response';
import { paginationShape } from '../schemas/common.schema';

/** Dependencias que necesitan las tools de áreas. */
export interface AreaToolsDeps {
  areasService: AreasService;
}

/** Registra las tools relacionadas con áreas. */
export function registerAreaTools(
  server: McpServer,
  deps: AreaToolsDeps,
): void {
  server.registerTool(
    'listar_areas',
    {
      title: 'Listar áreas',
      description: 'Lista las áreas del sistema con filtros opcionales.',
      inputSchema: {
        search: z
          .string()
          .optional()
          .describe('Texto a buscar en el nombre del área'),
        estado: z
          .boolean()
          .optional()
          .describe('true = activas, false = inactivas'),
        ...paginationShape,
      },
    },
    async ({ search, estado, page, limit }) => {
      const query = new QueryAreaDto();
      query.page = page;
      query.limit = limit;
      if (search) query.search = search;
      if (estado !== undefined) query.estado = String(estado);

      return jsonResult(await deps.areasService.findAll(query));
    },
  );
}
