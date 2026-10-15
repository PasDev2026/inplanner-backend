import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { UsersService } from '../../users/users.service';
import { QueryUserDto } from '../../users/dtos/query-user.dto';
import { jsonResult } from '../lib/format-tool-response';
import { toSafeUser } from '../lib/user-mapper';
import { paginationShape } from '../schemas/common.schema';

/** Dependencias que necesitan las tools de usuarios. */
export interface UserToolsDeps {
  usersService: UsersService;
}

/** Registra las tools relacionadas con usuarios (sin exponer PII). */
export function registerUserTools(
  server: McpServer,
  deps: UserToolsDeps,
): void {
  server.registerTool(
    'listar_usuarios',
    {
      title: 'Listar usuarios',
      description:
        'Lista usuarios con filtros opcionales, paginados. Solo devuelve ' +
        'datos laborales (nombre, apellidos, área y estado); no expone datos personales.',
      inputSchema: {
        search: z.string().optional().describe('Texto a buscar en el nombre'),
        area_id: z
          .array(z.number().int())
          .optional()
          .describe('Filtrar por uno o varios IDs de área'),
        estado: z
          .boolean()
          .optional()
          .describe('true = activos, false = inactivos'),
        ...paginationShape,
      },
    },
    async ({ search, area_id, estado, page, limit }) => {
      const query = new QueryUserDto();
      query.page = page;
      query.limit = limit;
      if (search) query.search = search;
      if (area_id && area_id.length > 0) query.area_id = area_id.join(',');
      if (estado !== undefined) query.estado = String(estado);

      const result = await deps.usersService.findAll(query);
      return jsonResult({
        data: result.data.map(toSafeUser),
        meta: result.meta,
      });
    },
  );

  server.registerTool(
    'detalle_usuario',
    {
      title: 'Detalle de usuario',
      description:
        'Devuelve un usuario por su UUID con datos laborales (sin datos personales).',
      inputSchema: {
        id: z.string().uuid().describe('UUID del usuario (id_user)'),
      },
    },
    async ({ id }) =>
      jsonResult(toSafeUser(await deps.usersService.findOne(id))),
  );
}
