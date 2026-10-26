import type {
  ImportAction,
  ImportChange,
  ImportRowPlan,
  ImportRowWarning,
} from '../../lib/import-diff';
import type { ImportRowError } from '../../lib/import-activities.parser';

export class ImportPreviewRowDto {
  numeroFila: number;
  existing_task_id?: number;
  task_name: string;
  task_description?: string;
  nivel: number;
  start_date?: string;
  due_date?: string;
  responsables?: string[];
  estado: number;
  accion: ImportAction;
  cambios: ImportChange[];
}

export interface ImportPreviewSource {
  plans: ImportRowPlan[];
  nivelesEfectivos: number[];
  ignoradas: number;
  errores: ImportRowError[];
  avisos: ImportRowWarning[];
  /** Filas con error que no deben mostrarse como importables. */
  filasConError: Set<number>;
}

export class ImportPreviewDto {
  total: number;
  validas: number;
  creadas: number;
  actualizadas: number;
  omitidas: number;
  ignoradas: number;
  errores: ImportRowError[];
  avisos: ImportRowWarning[];
  filas: ImportPreviewRowDto[];

  static from(source: ImportPreviewSource): ImportPreviewDto {
    const dto = new ImportPreviewDto();

    dto.filas = source.plans
      .map((plan, index) => ({ plan, nivel: source.nivelesEfectivos[index] }))
      .filter(({ plan }) => !source.filasConError.has(plan.row.numeroFila))
      .map(({ plan, nivel }) => ({
        numeroFila: plan.row.numeroFila,
        existing_task_id: plan.row.existing_task_id,
        task_name: plan.row.task_name,
        task_description: plan.row.task_description,
        nivel: nivel ?? plan.row.nivel,
        start_date: plan.row.start_date,
        due_date: plan.row.due_date,
        responsables: plan.row.responsables,
        estado: plan.row.estado,
        accion: plan.action,
        cambios: plan.changes,
      }));

    dto.creadas = dto.filas.filter((f) => f.accion === 'crear').length;
    dto.actualizadas = dto.filas.filter(
      (f) => f.accion === 'actualizar',
    ).length;
    dto.omitidas = dto.filas.filter((f) => f.accion === 'omitir').length;
    dto.validas = dto.filas.length;
    dto.ignoradas = source.ignoradas;
    dto.errores = source.errores;
    dto.avisos = source.avisos;
    dto.total = dto.validas + dto.ignoradas + dto.errores.length;

    return dto;
  }
}
