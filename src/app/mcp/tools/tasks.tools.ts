import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TasksService } from '../../tasks/tasks.service';
import { QueryTaskDto } from '../../tasks/dtos/query-task.dto';
import { jsonResult } from '../lib/format-tool-response';
import { paginationShape } from '../schemas/common.schema';
import { GetOverdueTasksUseCase } from '../use-cases/get-overdue-tasks.use-case';
import { GetUserActivityUseCase } from '../use-cases/get-user-activity.use-case';
import { GetUserLoadUseCase } from '../use-cases/get-user-load.use-case';

/** Dependencias que necesitan las tools de tareas. */
export interface TaskToolsDeps {
  tasksService: TasksService;
  getUserActivity: GetUserActivityUseCase;
  getUserLoad: GetUserLoadUseCase;
  getOverdueTasks: GetOverdueTasksUseCase;
}

const STATUS_HINT =
  'status: 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado.';

/** Registra las tools relacionadas con tareas/actividades. */
export function registerTaskTools(
  server: McpServer,
  deps: TaskToolsDeps,
): void {
  server.registerTool(
    'buscar_tareas',
    {
      title: 'Buscar tareas',
      description: `Lista tareas con filtros opcionales, paginadas. ${STATUS_HINT}`,
      inputSchema: {
        project_id: z
          .number()
          .int()
          .optional()
          .describe('Filtrar por ID de proyecto'),
        status: z
          .number()
          .int()
          .min(0)
          .max(4)
          .optional()
          .describe('Filtrar por estado'),
        priority: z.number().int().optional().describe('Filtrar por prioridad'),
        search: z
          .string()
          .optional()
          .describe('Texto a buscar en el nombre de la tarea'),
        ...paginationShape,
      },
    },
    async ({ project_id, status, priority, search, page, limit }) => {
      const query = new QueryTaskDto();
      query.page = page;
      query.limit = limit;
      if (project_id !== undefined) query.project_id = project_id;
      if (status !== undefined) query.status = status;
      if (priority !== undefined) query.priority = priority;
      if (search) query.search = search;

      return jsonResult(await deps.tasksService.findAll(query));
    },
  );

  server.registerTool(
    'detalle_tarea',
    {
      title: 'Detalle de tarea',
      description:
        'Devuelve una tarea por su ID, incluyendo usuarios asignados y notas.',
      inputSchema: {
        id: z.number().int().describe('ID de la tarea (id_task)'),
      },
    },
    async ({ id }) => jsonResult(await deps.tasksService.findOne(id)),
  );

  server.registerTool(
    'jerarquia_tarea',
    {
      title: 'Subtareas de una tarea',
      description: 'Devuelve las subtareas directas de una tarea.',
      inputSchema: {
        id: z.number().int().describe('ID de la tarea padre (id_task)'),
      },
    },
    async ({ id }) => jsonResult(await deps.tasksService.findChildren(id)),
  );

  server.registerTool(
    'actividad_usuario',
    {
      title: 'Actividad de un usuario',
      description:
        'Tareas creadas/actualizadas/completadas por un usuario en un rango de ' +
        'fechas (por defecto, hoy). IMPORTANTE: refleja lo registrado en el sistema, ' +
        'que no necesariamente equivale a lo que la persona hizo.',
      inputSchema: {
        usuario: z.string().uuid().describe('UUID del usuario (id_user)'),
        desde: z
          .string()
          .optional()
          .describe('Fecha inicial ISO (YYYY-MM-DD). Por defecto: hoy'),
        hasta: z
          .string()
          .optional()
          .describe('Fecha final ISO (YYYY-MM-DD). Por defecto: hoy'),
      },
    },
    async ({ usuario, desde, hasta }) =>
      jsonResult(await deps.getUserActivity.execute(usuario, desde, hasta)),
  );

  server.registerTool(
    'carga_por_usuario',
    {
      title: 'Carga por usuario',
      description:
        'Tareas asignadas por usuario, desglosadas por estado y vencidas.',
      inputSchema: {},
    },
    async () => jsonResult(await deps.getUserLoad.execute()),
  );

  server.registerTool(
    'tareas_vencidas',
    {
      title: 'Tareas vencidas',
      description:
        'Tareas con fecha límite pasada y sin completar. Se puede filtrar por ' +
        'antigüedad mínima de vencimiento y por proyecto.',
      inputSchema: {
        min_dias_vencida: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Solo tareas vencidas hace al menos N días'),
        project_id: z
          .number()
          .int()
          .optional()
          .describe('Filtrar por ID de proyecto'),
      },
    },
    async ({ min_dias_vencida, project_id }) =>
      jsonResult(
        await deps.getOverdueTasks.execute(min_dias_vencida, project_id),
      ),
  );
}
