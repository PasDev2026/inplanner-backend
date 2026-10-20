import type { TaskEntity } from '../entities/task.entity';
import { fullName } from './import-responsibles';
import type { ImportTemplateRow } from './import-template';
import { orderTasksByHierarchy } from './task-hierarchy';

/** Fecha (timestamp o ISO) a YYYY-MM-DD; cadena vacía si no hay valor. */
export function dateToIso(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Convierte las tareas de un proyecto al formato de la plantilla de
 * importación. El `id_task` viaja en la columna ID para que una reimportación
 * pueda omitir o actualizar las filas existentes sin duplicarlas.
 */
export function buildProjectExportRows(
  tasks: TaskEntity[],
  responsibleLabels: Map<string, string>,
): ImportTemplateRow[] {
  return orderTasksByHierarchy(tasks).map(({ task, level }) => {
    const names = (task.assignments ?? [])
      .map(
        (assignment) =>
          responsibleLabels.get(assignment.user_id) ??
          (assignment.user ? fullName(assignment.user) : ''),
      )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));

    return {
      id: task.id_task,
      name: task.task_name,
      description: task.task_description ?? '',
      level,
      startDate: dateToIso(task.start_date),
      dueDate: dateToIso(task.due_date),
      status: task.status,
      responsible: names[0] ?? '',
      responsible2: names.slice(1).join(', '),
    };
  });
}
