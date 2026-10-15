import { InjectionToken } from '@nestjs/common';

export const MCP_REPOSITORY = 'MCP_REPOSITORY' as InjectionToken;

/** Rendimiento agregado de un área (atribución por manager, igual que el dashboard). */
export interface AreaPerformanceRow {
  id_area: number;
  nombre_area: string;
  proyectos: number;
  tareas: number;
  completadas: number;
  en_progreso: number;
  vencidas: number;
  /** % de avance = completadas / tareas * 100 (0 si no hay tareas). */
  avance: number;
}

/** Proyecto dentro del detalle de un área. */
export interface AreaDetailProjectRow {
  id_project: number;
  name_project: string;
  status: number;
  tareas: number;
  completadas: number;
}

/** Detalle de un área: datos, número de usuarios y sus proyectos. */
export interface AreaDetail {
  id_area: number;
  nombre_area: string;
  estado: boolean;
  usuarios: number;
  proyectos: AreaDetailProjectRow[];
}

/** Resumen de actividad de un usuario en un rango de fechas. */
export interface UserActivitySummary {
  creadas: number;
  actualizadas: number;
  completadas: number;
}

/** Tarea tocada por un usuario dentro del rango. */
export interface UserActivityItem {
  id_task: number;
  task_name: string;
  status: number;
  project_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserActivity {
  resumen: UserActivitySummary;
  tareas: UserActivityItem[];
}

/** Carga de trabajo por usuario. */
export interface UserLoadRow {
  id_user: string;
  name: string;
  apellido_paterno: string | null;
  total: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  vencidas: number;
}

/** Tarea vencida. */
export interface OverdueTaskRow {
  id_task: number;
  task_name: string;
  status: number;
  due_date: Date;
  project_id: number;
  project_name: string;
  dias_vencida: number;
}

/** Fila de proyecto para exportación a Excel. */
export interface ExportProjectRow {
  id_project: number;
  name_project: string;
  status: number;
  priority: number | null;
  manager_name: string | null;
  sede_id: string | null;
  start_date: Date | null;
  due_date: Date | null;
  created_at: Date;
}

/** Fila de tarea para exportación a Excel. */
export interface ExportTaskRow {
  id_task: number;
  task_name: string;
  status: number;
  priority: number | null;
  project_name: string | null;
  start_date: Date | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Resumen de proyectos por sede. */
export interface ProjectSedeRow {
  sede_id: string | null;
  proyectos: number;
  completados: number;
}

/** Métricas generales del sistema. */
export interface GeneralMetrics {
  proyectos: {
    total: number;
    planificacion: number;
    activo: number;
    en_espera: number;
    completado: number;
    cancelado: number;
  };
  tareas: {
    total: number;
    pendientes: number;
    en_espera: number;
    en_progreso: number;
    en_revision: number;
    completadas: number;
    vencidas: number;
  };
}

export interface IMcpRepository {
  getAreaPerformance(areaIds?: number[]): Promise<AreaPerformanceRow[]>;
  getAreaDetail(areaId: number): Promise<AreaDetail | null>;
  getUserActivity(userId: string, from: Date, to: Date): Promise<UserActivity>;
  getUserLoad(): Promise<UserLoadRow[]>;
  getOverdueTasks(
    minDiasVencida?: number,
    projectId?: number,
  ): Promise<OverdueTaskRow[]>;
  getGeneralMetrics(): Promise<GeneralMetrics>;
  getProjectsBySede(): Promise<ProjectSedeRow[]>;
  getProjectsForExport(): Promise<ExportProjectRow[]>;
  getTasksForExport(): Promise<ExportTaskRow[]>;
}
