import { buildHierarchyMap, sortByHierarchy } from './report-hierarchy';
import type { ActivityReportRow } from '../interfaces/report.interface';

const base = (over: Partial<ActivityReportRow>): ActivityReportRow => ({
  id_task: 0,
  task_name: 'x',
  task_description: null,
  status: 0,
  priority: 1,
  start_date: null,
  due_date: null,
  created_at: new Date('2026-01-01T10:00:00Z'),
  updated_at: new Date('2026-01-01T10:00:00Z'),
  parent_task_id: null,
  id_project: 1,
  project_name: 'P',
  project_status: 0,
  project_due_date: null,
  sede_id: null,
  manager_id: null,
  assignments: null,
  ...over,
});

describe('buildHierarchyMap', () => {
  it('numbers parent/child/grandchild', () => {
    const rows = [
      base({ id_task: 3, parent_task_id: 2, created_at: new Date('2026-01-03T10:00:00Z') }),
      base({ id_task: 1, created_at: new Date('2026-01-01T10:00:00Z') }),
      base({ id_task: 2, parent_task_id: 1, created_at: new Date('2026-01-02T10:00:00Z') }),
    ];
    const map = buildHierarchyMap(rows);
    expect(map.get(1)).toEqual({ path: '1', level: 1 });
    expect(map.get(2)).toEqual({ path: '1.1', level: 2 });
    expect(map.get(3)).toEqual({ path: '1.1.1', level: 3 });
  });

  it('restarts numbering per project', () => {
    const rows = [
      base({ id_task: 1, id_project: 1 }),
      base({ id_task: 2, id_project: 2 }),
    ];
    const map = buildHierarchyMap(rows);
    expect(map.get(1)?.path).toBe('1');
    expect(map.get(2)?.path).toBe('1');
  });

  it('treats a task whose parent is filtered out as a root', () => {
    const rows = [
      base({ id_task: 2, parent_task_id: 99, created_at: new Date('2026-01-02T10:00:00Z') }),
      base({ id_task: 1, created_at: new Date('2026-01-01T10:00:00Z') }),
    ];
    const map = buildHierarchyMap(rows);
    expect(map.get(2)?.path).toBe('2');
  });

  it('sorts rows into tree order (parent before children, siblings numeric)', () => {
    const rows = [
      base({ id_task: 3, parent_task_id: 2, created_at: new Date('2026-01-04T10:00:00Z') }),
      base({ id_task: 1, created_at: new Date('2026-01-01T10:00:00Z') }),
      base({ id_task: 4, parent_task_id: 1, created_at: new Date('2026-01-03T10:00:00Z') }),
      base({ id_task: 2, parent_task_id: 1, created_at: new Date('2026-01-02T10:00:00Z') }),
    ];
    const hier = buildHierarchyMap(rows);
    const sorted = sortByHierarchy(rows, hier);
    expect(sorted.map((r) => hier.get(r.id_task)?.path)).toEqual([
      '1',
      '1.1',
      '1.1.1',
      '1.2',
    ]);
  });

  it('orders 1.2 before 1.10 and groups projects alphabetically', () => {
    const rows = [
      base({ id_task: 2, parent_task_id: 1, project_name: 'Beta', created_at: new Date('2026-01-10T10:00:00Z') }),
      base({ id_task: 3, parent_task_id: 1, project_name: 'Beta', created_at: new Date('2026-01-02T10:00:00Z') }),
      base({ id_task: 1, project_name: 'Beta' }),
      base({ id_task: 4, id_project: 2, project_name: 'Alpha' }),
    ];
    const hier = buildHierarchyMap(rows);
    const sorted = sortByHierarchy(rows, hier);
    expect(sorted.map((r) => r.id_task)).toEqual([4, 1, 3, 2]);
  });
});
