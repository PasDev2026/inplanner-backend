export interface ReportFilters {
  search?: string;
  status?: string;
  priority?: string;
  sede_id?: string;
  responsible_id?: string;
  project_id?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ActivityAssignment {
  user_id: string;
  name: string | null;
  apellido_paterno: string | null;
}

export interface ActivityReportRow {
  id_task: number;
  task_name: string;
  task_description: string | null;
  status: number;
  priority: number;
  start_date: Date | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  parent_task_id: number | null;
  id_project: number;
  project_name: string;
  project_status: number;
  project_due_date: Date | null;
  sede_id: string | null;
  manager_id: string | null;
  assignments: ActivityAssignment[] | null;
}

export interface ActivityExcelRow {
  task_name: string;
  responsible: string;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  project_name: string;
  project_status: string;
}
