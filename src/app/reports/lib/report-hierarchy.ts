import type { ActivityReportRow } from '../interfaces/report.interface';

export interface HierarchyInfo {
  path: string;
  level: number;
}

// ponytail: orden por proyecto (alfabético) y luego por path numérico, igual que
// ORDER BY path_array de Postgres (1.2 antes que 1.10, 1 antes que 1.1).
export function sortByHierarchy(
  rows: ActivityReportRow[],
  hierarchy: Map<number, HierarchyInfo>,
): ActivityReportRow[] {
  const pathNums = (r: ActivityReportRow): number[] | null => {
    const path = hierarchy.get(r.id_task)?.path;
    return path ? path.split('.').map(Number) : null;
  };

  return [...rows].sort((a, b) => {
    const name = a.project_name.localeCompare(b.project_name);
    if (name !== 0) return name;
    const pa = pathNums(a);
    const pb = pathNums(b);
    if (pa === null) return pb === null ? 0 : 1;
    if (pb === null) return -1;
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      // path corto (prefijo) va primero: segmento faltante = -Infinity
      const diff =
        (pa[i] ?? Number.NEGATIVE_INFINITY) -
        (pb[i] ?? Number.NEGATIVE_INFINITY);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

// ponytail: numeración por proyecto (reinicia en 1 por proyecto), raíces e hijos
// por created_at, igual que el CTE recursivo que usaba el usuario. Un padre que
// quedó fuera del resultado (filtros) convierte a la tarea en raíz, sin perderla.
const MAX_DEPTH = 32;

export function buildHierarchyMap(
  rows: ActivityReportRow[],
): Map<number, HierarchyInfo> {
  const byId = new Map(rows.map((r) => [r.id_task, r]));
  const result = new Map<number, HierarchyInfo>();
  const byProject = new Map<number, ActivityReportRow[]>();

  for (const r of rows) {
    const list = byProject.get(r.id_project);
    if (list) list.push(r);
    else byProject.set(r.id_project, [r]);
  }

  for (const projectRows of byProject.values()) {
    const children = new Map<number, ActivityReportRow[]>();
    const roots: ActivityReportRow[] = [];
    for (const r of projectRows) {
      if (r.parent_task_id != null && byId.has(r.parent_task_id)) {
        const list = children.get(r.parent_task_id);
        if (list) list.push(r);
        else children.set(r.parent_task_id, [r]);
      } else {
        roots.push(r);
      }
    }

    const sortByCreated = (a: ActivityReportRow, b: ActivityReportRow) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    const queue: Array<{ row: ActivityReportRow; path: string }> = [];
    roots
      .sort(sortByCreated)
      .forEach((row, i) => queue.push({ row, path: String(i + 1) }));

    for (let head = 0; head < queue.length; head++) {
      const { row, path } = queue[head];
      const level = path.split('.').length;
      if (level > MAX_DEPTH) continue;
      result.set(row.id_task, { path, level });
      const subs = (children.get(row.id_task) ?? [])
        .sort(sortByCreated)
        .map((child, i) => ({ row: child, path: `${path}.${i + 1}` }));
      queue.push(...subs);
    }
  }

  return result;
}
