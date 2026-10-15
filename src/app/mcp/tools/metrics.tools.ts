import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GetAreaDetailUseCase } from '../use-cases/get-area-detail.use-case';
import { GetAreaPerformanceUseCase } from '../use-cases/get-area-performance.use-case';
import { GetGeneralMetricsUseCase } from '../use-cases/get-general-metrics.use-case';
import { jsonResult } from '../lib/format-tool-response';

/** Dependencias que necesitan las tools analíticas. */
export interface MetricsToolsDeps {
  getAreaPerformance: GetAreaPerformanceUseCase;
  getAreaDetail: GetAreaDetailUseCase;
  getGeneralMetrics: GetGeneralMetricsUseCase;
}

const areaIdsSchema = z
  .array(z.number().int())
  .optional()
  .describe('IDs de área a incluir (vacío = todas)');

/** Registra las tools analíticas y de rendimiento por área. */
export function registerMetricsTools(
  server: McpServer,
  deps: MetricsToolsDeps,
): void {
  server.registerTool(
    'rendimiento_por_area',
    {
      title: 'Rendimiento por área',
      description:
        'Tabla comparativa de todas las áreas (o de un subconjunto): proyectos, ' +
        'tareas, completadas, en progreso, vencidas y % de avance. ' +
        'Un proyecto pertenece al área de su manager.',
      inputSchema: {
        area_ids: areaIdsSchema,
      },
    },
    async ({ area_ids }) =>
      jsonResult(await deps.getAreaPerformance.execute(area_ids)),
  );

  server.registerTool(
    'detalle_area',
    {
      title: 'Detalle de un área',
      description:
        'Devuelve los datos de un área, su número de usuarios y sus proyectos ' +
        'con progreso (tareas totales y completadas).',
      inputSchema: {
        id: z.number().int().describe('ID del área (id_area)'),
      },
    },
    async ({ id }) => jsonResult(await deps.getAreaDetail.execute(id)),
  );

  server.registerTool(
    'comparar_areas',
    {
      title: 'Comparar áreas',
      description:
        'Compara dos o más áreas lado a lado (mismas métricas que rendimiento_por_area).',
      inputSchema: {
        area_ids: z
          .array(z.number().int())
          .min(2)
          .describe('IDs de las áreas a comparar (mínimo 2)'),
      },
    },
    async ({ area_ids }) =>
      jsonResult(await deps.getAreaPerformance.execute(area_ids)),
  );

  server.registerTool(
    'metricas_generales',
    {
      title: 'Métricas generales',
      description:
        'Totales del sistema: proyectos y tareas por estado, y cantidad de vencidas.',
      inputSchema: {},
    },
    async () => jsonResult(await deps.getGeneralMetrics.execute()),
  );
}
