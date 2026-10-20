/**
 * Ordenamiento jerárquico de tareas para exportación.
 *
 * El importador reconstruye la jerarquía con la columna "Nivel" y el orden de
 * las filas (stack). Por eso el export debe emitir siempre al padre antes que
 * a sus hijos. Este helper hace un DFS determinista: hermanos por `position`
 * y, en empate, por `created_at`.
 *
 * Es lógica pura para poder testearla sin BD.
 */

export interface HierarchicalTask {
  id_task: number;
  parent_task_id: number | null;
  position?: number | null;
  created_at?: Date | string | null;
}

export interface OrderedTask<T extends HierarchicalTask> {
  task: T;
  level: number;
}

const MAX_DEPTH = 64;

function timeOf(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortSiblings<T extends HierarchicalTask>(a: T, b: T): number {
  const byPosition = (a.position ?? 0) - (b.position ?? 0);
  if (byPosition !== 0) return byPosition;
  return timeOf(a.created_at) - timeOf(b.created_at);
}

export function orderTasksByHierarchy<T extends HierarchicalTask>(
  tasks: T[],
): OrderedTask<T>[] {
  const byId = new Map(tasks.map((task) => [task.id_task, task]));
  const children = new Map<number, T[]>();
  const roots: T[] = [];

  for (const task of tasks) {
    if (task.parent_task_id != null && byId.has(task.parent_task_id)) {
      const list = children.get(task.parent_task_id) ?? [];
      list.push(task);
      children.set(task.parent_task_id, list);
    } else {
      roots.push(task);
    }
  }

  const result: OrderedTask<T>[] = [];
  const visited = new Set<number>();

  const visit = (task: T, level: number): void => {
    if (visited.has(task.id_task) || level > MAX_DEPTH) return;
    visited.add(task.id_task);
    result.push({ task, level });
    const sortedChildren = [...(children.get(task.id_task) ?? [])].sort(
      sortSiblings,
    );
    for (const child of sortedChildren) {
      visit(child, level + 1);
    }
  };

  for (const root of [...roots].sort(sortSiblings)) {
    visit(root, 1);
  }

  // Datos inconsistentes (ciclos): no perder tareas silenciosamente.
  for (const task of [...tasks].sort(sortSiblings)) {
    if (!visited.has(task.id_task)) visit(task, 1);
  }

  return result;
}
