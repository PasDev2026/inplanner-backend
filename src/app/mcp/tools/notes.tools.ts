import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NotesService } from '../../notes/notes.service';
import { QueryNoteDto } from '../../notes/dtos/query-note.dto';
import { jsonResult } from '../lib/format-tool-response';
import { paginationShape } from '../schemas/common.schema';

/** Dependencias que necesitan las tools de notas. */
export interface NoteToolsDeps {
  notesService: NotesService;
}

/** Registra las tools relacionadas con notas. */
export function registerNoteTools(
  server: McpServer,
  deps: NoteToolsDeps,
): void {
  server.registerTool(
    'notas_de_tarea',
    {
      title: 'Notas de una tarea',
      description: 'Lista las notas asociadas a una tarea, paginadas.',
      inputSchema: {
        task_id: z.number().int().describe('ID de la tarea (id_task)'),
        ...paginationShape,
      },
    },
    async ({ task_id, page, limit }) => {
      const query = new QueryNoteDto();
      query.page = page;
      query.limit = limit;
      query.task_id = task_id;

      return jsonResult(await deps.notesService.findAll(query));
    },
  );
}
