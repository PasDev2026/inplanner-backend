import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MCP_REPOSITORY,
  type ExportProjectRow,
  type ExportTaskRow,
  type IMcpRepository,
} from '../repository/mcp-repository.interface';
import {
  buildWorkbook,
  type ExcelColumn,
  type ExcelRow,
} from '../lib/excel-builder';
import { uploadExcelAndSign, type ExportedFile } from '../lib/s3-export';
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../constants/mcp.constants';
import { GetAreaPerformanceUseCase } from './get-area-performance.use-case';
import { GetOverdueTasksUseCase } from './get-overdue-tasks.use-case';
import { GetUserLoadUseCase } from './get-user-load.use-case';

export const EXPORT_DATASETS = [
  'proyectos',
  'tareas',
  'rendimiento_por_area',
  'tareas_vencidas',
  'carga_por_usuario',
] as const;

export type ExportDataset = (typeof EXPORT_DATASETS)[number];

interface BuiltSheet {
  sheetName: string;
  columns: ExcelColumn[];
  rows: ExcelRow[];
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
  4: 'Crítica',
};

/** Exporta un conjunto de datos a Excel y devuelve un link presignado. */
@Injectable()
export class ExportDatasetUseCase {
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly repository: IMcpRepository,
    private readonly getAreaPerformance: GetAreaPerformanceUseCase,
    private readonly getOverdueTasks: GetOverdueTasksUseCase,
    private readonly getUserLoad: GetUserLoadUseCase,
  ) {}

  async execute(
    dataset: ExportDataset,
    areaIds?: number[],
  ): Promise<ExportedFile> {
    const sheet = await this.buildSheet(dataset, areaIds);
    const buffer = await buildWorkbook(
      sheet.sheetName,
      sheet.columns,
      sheet.rows,
    );
    return uploadExcelAndSign(
      buffer,
      `${dataset}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  private buildSheet(
    dataset: ExportDataset,
    areaIds?: number[],
  ): Promise<BuiltSheet> | BuiltSheet {
    switch (dataset) {
      case 'proyectos':
        return this.buildProyectos();
      case 'tareas':
        return this.buildTareas();
      case 'rendimiento_por_area':
        return this.buildRendimiento(areaIds);
      case 'tareas_vencidas':
        return this.buildVencidas();
      case 'carga_por_usuario':
        return this.buildCarga();
      default:
        throw new BadRequestException(
          `Dataset no soportado: ${String(dataset)}`,
        );
    }
  }

  private async buildProyectos(): Promise<BuiltSheet> {
    const projects = await this.repository.getProjectsForExport();
    return {
      sheetName: 'Proyectos',
      columns: [
        { key: 'id_project', header: 'ID' },
        { key: 'name_project', header: 'Proyecto' },
        { key: 'status', header: 'Estado' },
        { key: 'priority', header: 'Prioridad' },
        { key: 'manager_name', header: 'Manager' },
        { key: 'sede_id', header: 'Sede' },
        { key: 'start_date', header: 'Fecha inicio' },
        { key: 'due_date', header: 'Fecha vencimiento' },
        { key: 'created_at', header: 'Creado' },
      ],
      rows: projects.map((project: ExportProjectRow) => ({
        ...project,
        status: PROJECT_STATUS_LABELS[project.status] ?? project.status,
        priority: project.priority
          ? (PRIORITY_LABELS[project.priority] ?? project.priority)
          : '',
        start_date: this.formatDate(project.start_date),
        due_date: this.formatDate(project.due_date),
        created_at: this.formatDate(project.created_at),
      })),
    };
  }

  private async buildTareas(): Promise<BuiltSheet> {
    const tasks = await this.repository.getTasksForExport();
    return {
      sheetName: 'Tareas',
      columns: [
        { key: 'id_task', header: 'ID' },
        { key: 'task_name', header: 'Tarea' },
        { key: 'status', header: 'Estado' },
        { key: 'priority', header: 'Prioridad' },
        { key: 'project_name', header: 'Proyecto' },
        { key: 'due_date', header: 'Fecha vencimiento' },
        { key: 'created_at', header: 'Creado' },
        { key: 'updated_at', header: 'Actualizado' },
      ],
      rows: tasks.map((task: ExportTaskRow) => ({
        ...task,
        status: TASK_STATUS_LABELS[task.status] ?? task.status,
        priority: task.priority
          ? (PRIORITY_LABELS[task.priority] ?? task.priority)
          : '',
        due_date: this.formatDate(task.due_date),
        start_date: this.formatDate(task.start_date),
        created_at: this.formatDate(task.created_at),
        updated_at: this.formatDate(task.updated_at),
      })),
    };
  }

  private async buildRendimiento(areaIds?: number[]): Promise<BuiltSheet> {
    const rows = await this.getAreaPerformance.execute(areaIds);
    return {
      sheetName: 'Rendimiento por área',
      columns: [
        { key: 'nombre_area', header: 'Área' },
        { key: 'proyectos', header: 'Proyectos' },
        { key: 'tareas', header: 'Tareas' },
        { key: 'completadas', header: 'Completadas' },
        { key: 'en_progreso', header: 'En progreso' },
        { key: 'vencidas', header: 'Vencidas' },
        { key: 'avance', header: '% Avance' },
      ],
      rows: rows as unknown as ExcelRow[],
    };
  }

  private async buildVencidas(): Promise<BuiltSheet> {
    const rows = await this.getOverdueTasks.execute();
    return {
      sheetName: 'Tareas vencidas',
      columns: [
        { key: 'id_task', header: 'ID' },
        { key: 'task_name', header: 'Tarea' },
        { key: 'project_name', header: 'Proyecto' },
        { key: 'status', header: 'Estado' },
        { key: 'due_date', header: 'Fecha vencimiento' },
        { key: 'dias_vencida', header: 'Días vencida' },
      ],
      rows: rows.map((row) => ({
        ...row,
        status: TASK_STATUS_LABELS[row.status] ?? row.status,
        due_date: this.formatDate(row.due_date),
      })) as unknown as ExcelRow[],
    };
  }

  private async buildCarga(): Promise<BuiltSheet> {
    const rows = await this.getUserLoad.execute();
    return {
      sheetName: 'Carga por usuario',
      columns: [
        { key: 'name', header: 'Nombre' },
        { key: 'apellido_paterno', header: 'Apellido' },
        { key: 'total', header: 'Total' },
        { key: 'pendientes', header: 'Pendientes' },
        { key: 'en_progreso', header: 'En progreso' },
        { key: 'completadas', header: 'Completadas' },
        { key: 'vencidas', header: 'Vencidas' },
      ],
      rows: rows as unknown as ExcelRow[],
    };
  }

  private formatDate(value: Date | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }
}
