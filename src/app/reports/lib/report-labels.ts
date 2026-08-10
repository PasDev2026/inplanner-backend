import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../constants/report.constants';
import type {
  ActivityExcelRow,
  ActivityReportRow,
} from '../interfaces/report.interface';
import type { HierarchyInfo } from './report-hierarchy';

export const dateLabel = (d: Date | null): string =>
  d ? d.toISOString().slice(0, 10) : '';

export function toActivityExcelRow(
  row: ActivityReportRow,
  hierarchy?: HierarchyInfo,
): ActivityExcelRow {
  return {
    task_name: hierarchy
      ? '   '.repeat(hierarchy.level - 1) +
        `${hierarchy.path}. ${row.task_name}`
      : row.task_name,
    responsible: (row.assignments ?? [])
      .map((a) => [a.name, a.apellido_paterno].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', '),
    status: TASK_STATUS_LABELS[row.status] ?? String(row.status),
    priority: PRIORITY_LABELS[row.priority] ?? '',
    start_date: dateLabel(row.start_date),
    due_date: dateLabel(row.due_date),
    project_name: row.project_name,
    project_status:
      PROJECT_STATUS_LABELS[row.project_status] ?? String(row.project_status),
  };
}
