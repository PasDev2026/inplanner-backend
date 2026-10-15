import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../constants/mcp.constants';
import { textResult } from '../lib/format-tool-response';

/**
 * Diccionario del sistema. Se expone como tool para que el modelo entienda
 * el vocabulario y, sobre todo, que los estados de proyecto y de tarea
 * NO son equivalentes.
 */
const SYSTEM_DESCRIPTION = `Sistema: Inplanner (gestión de proyectos y actividades).

Entidades principales:
- projects: proyectos. Campos: id_project, name_project, manager_id, sede_id, status, priority, start_date, due_date.
- tasks: tareas/actividades. Campos: id_task, task_name, project_id, parent_task_id, status, priority, start_date, due_date, created_by_id, completed_by_id.
- task_assignments: usuarios asignados a una tarea (task_id, user_id).
- project_responsibles: usuarios responsables de un proyecto (project_id, user_id).
- users: usuarios. Campos: id_user, name, email, area (área), sede_id, estado.
- areas: áreas. Campos: id_area, nombre_area.
- notes: notas asociadas a tareas.

ESTADOS DE TAREA (task.status):
${Object.entries(TASK_STATUS_LABELS)
  .map(([k, v]) => `  ${k} = ${v}`)
  .join('\n')}

ESTADOS DE PROYECTO (project.status) — ¡OJO, NO son los mismos que los de tarea!:
${Object.entries(PROJECT_STATUS_LABELS)
  .map(([k, v]) => `  ${k} = ${v}`)
  .join('\n')}
En particular: 4 = "Completado" en tarea, pero "Cancelado" en proyecto.

Atribución por área (convención del dashboard):
- Un proyecto pertenece al área de su manager (projects.manager_id -> users.area_id).
- Las tareas de un área son las de los proyectos de esa área.
- Usuarios sin área se agrupan como "Sin área".`;

/** Tool que describe el sistema para dar contexto al modelo. */
export function registerSystemTools(server: McpServer): void {
  server.registerTool(
    'describir_sistema',
    {
      title: 'Describir sistema',
      description:
        'Devuelve un diccionario del sistema Inplanner: entidades, campos y el significado de los estados (de tarea y de proyecto).',
    },
    () => textResult(SYSTEM_DESCRIPTION),
  );
}
