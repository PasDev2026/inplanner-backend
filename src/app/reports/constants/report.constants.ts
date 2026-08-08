import type { ActivityExcelRow } from '../interfaces/report.interface';

export const DB_SCHEMA = 'inplanner';
// ponytail: dashboard.typeorm.repository hardcodea DB_SCHEMA por su cuenta;
// compartir a common/constants si se quieren centralizar.

export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'Pendiente',
  1: 'En espera',
  2: 'En progreso',
  3: 'En revisión',
  4: 'Completado',
};

export const PROJECT_STATUS_LABELS: Record<number, string> = {
  0: 'Planificación',
  1: 'Activo',
  2: 'En espera',
  3: 'Completado',
  4: 'Cancelado',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
  4: 'Crítica',
};

export const ACTIVITY_HEADERS: (keyof ActivityExcelRow)[] = [
  'task_name',
  'responsible',
  'status',
  'priority',
  'start_date',
  'due_date',
  'project_name',
  'project_status',
];

export const HEADER_LABELS: Record<string, string> = {
  task_name: 'Nombre de tarea',
  responsible: 'Responsable',
  status: 'Estado',
  priority: 'Prioridad',
  start_date: 'Fecha inicio',
  due_date: 'Fecha vencimiento',
  project_name: 'Proyecto',
  project_status: 'Estado del proyecto',
};
