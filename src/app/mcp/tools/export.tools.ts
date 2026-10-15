import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { linkResult } from '../lib/format-tool-response';
import { XLSX_MIME_TYPE } from '../lib/s3-export';
import {
  EXPORT_DATASETS,
  ExportDatasetUseCase,
} from '../use-cases/export-dataset.use-case';

/** Dependencias que necesita la tool de exportación. */
export interface ExportToolsDeps {
  exportDataset: ExportDatasetUseCase;
}

/** Registra la tool de exportación a Excel. */
export function registerExportTools(
  server: McpServer,
  deps: ExportToolsDeps,
): void {
  server.registerTool(
    'exportar_excel',
    {
      title: 'Exportar a Excel',
      description:
        'Genera un archivo Excel con los datos indicados y devuelve un enlace ' +
        'de descarga (válido ~1 hora). Datasets: proyectos, tareas, ' +
        'rendimiento_por_area, tareas_vencidas, carga_por_usuario.',
      inputSchema: {
        dataset: z
          .enum(EXPORT_DATASETS)
          .describe('Conjunto de datos a exportar'),
        area_ids: z
          .array(z.number().int())
          .optional()
          .describe('Solo para rendimiento_por_area: áreas a incluir'),
      },
    },
    async ({ dataset, area_ids }) => {
      const file = await deps.exportDataset.execute(dataset, area_ids);
      const name = `${dataset}.xlsx`;
      return linkResult({
        message:
          `Archivo generado: ${name}. ` +
          `Descárgalo aquí (el enlace expira en ${Math.round(file.expiresInSeconds / 60)} minutos): ${file.url}`,
        url: file.url,
        name,
        mimeType: XLSX_MIME_TYPE,
      });
    },
  );
}
