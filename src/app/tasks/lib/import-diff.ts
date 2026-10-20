/**
 * Planificación de una importación: decide, fila por fila, si hay que crear,
 * actualizar u omitir una tarea. La decisión se basa en el ID de la tarea y en
 * una comparación de los datos del Excel contra el estado actual en BD.
 *
 * Reglas:
 * - Sin ID (o ID ajeno al proyecto) -> crear.
 * - ID existente e igual a la BD -> omitir.
 * - ID existente con algún cambio -> actualizar.
 * - Celda vacía en una fila existente -> sin cambio (no borra datos).
 *
 * Lógica pura (sin BD) para poder testearla aisladamente.
 */

import { ImportRowError, ParsedActivityRow } from './import-activities.parser';
import { normalizePersonName } from './import-responsibles';
import { dateToIso } from './project-export';

export type ImportAction = 'crear' | 'actualizar' | 'omitir';

export type ImportChange =
  | 'name'
  | 'description'
  | 'startDate'
  | 'dueDate'
  | 'status'
  | 'parent'
  | 'responsibles';

export interface CurrentTaskSnapshot {
  id_task: number;
  task_name: string;
  task_description: string | null;
  status: number;
  start_date: Date | null;
  due_date: Date | null;
  /** Padre efectivo dentro del proyecto (null si es raíz o huérfana). */
  parent_task_id: number | null;
  /** Nombres visibles actuales de los responsables. */
  responsibleNames: string[];
}

export interface ImportRowWarning {
  numeroFila: number;
  mensaje: string;
}

export interface ImportRowPlan {
  row: ParsedActivityRow;
  action: ImportAction;
  changes: ImportChange[];
  parentIndex: number | null;
  existingTask?: CurrentTaskSnapshot;
  /** true si hay que convertir los nombres de responsables a UUIDs. */
  needsResponsibleResolution: boolean;
}

export interface PlanImportResult {
  plans: ImportRowPlan[];
  warnings: ImportRowWarning[];
}

/** Excluye filas con el mismo ID repetido; no se puede decidir cuál vale. */
export function filterDuplicateIds(rows: ParsedActivityRow[]): {
  rows: ParsedActivityRow[];
  errors: ImportRowError[];
} {
  const firstRowById = new Map<number, number>();
  const validRows: ParsedActivityRow[] = [];
  const errors: ImportRowError[] = [];

  for (const row of rows) {
    if (row.existing_task_id == null) {
      validRows.push(row);
      continue;
    }

    const firstRow = firstRowById.get(row.existing_task_id);
    if (firstRow !== undefined) {
      errors.push({
        numeroFila: row.numeroFila,
        mensaje: `ID ${row.existing_task_id} repetido (también en la fila ${firstRow})`,
      });
      continue;
    }

    firstRowById.set(row.existing_task_id, row.numeroFila);
    validRows.push(row);
  }

  return { rows: validRows, errors };
}

function sameNames(left: string[], right: string[]): boolean {
  const a = new Set(left.map(normalizePersonName).filter(Boolean));
  const b = new Set(right.map(normalizePersonName).filter(Boolean));
  if (a.size !== b.size) return false;
  for (const name of a) {
    if (!b.has(name)) return false;
  }
  return true;
}

function parentChanged(
  row: ParsedActivityRow,
  parentIndex: number | null,
  rows: ParsedActivityRow[],
  current: CurrentTaskSnapshot,
  knownTaskIds: Set<number>,
  parentTaskId: number | null,
): boolean {
  if (parentIndex === null) {
    return (parentTaskId ?? null) !== (current.parent_task_id ?? null);
  }

  const parentRow = rows[parentIndex];
  const parentExistingId =
    parentRow?.existing_task_id != null &&
    knownTaskIds.has(parentRow.existing_task_id)
      ? parentRow.existing_task_id
      : null;

  // Si el padre es una fila nueva (o con ID ajeno), la tarea quedará colgando
  // de una tarea recién creada: siempre es un cambio de padre.
  if (parentExistingId === null) return true;
  return current.parent_task_id !== parentExistingId;
}

/** Calcula las diferencias de una fila existente contra su estado actual. */
export function diffExistingTask(
  row: ParsedActivityRow,
  current: CurrentTaskSnapshot,
  parentIndex: number | null,
  rows: ParsedActivityRow[],
  knownTaskIds: Set<number>,
  parentTaskId: number | null,
): ImportChange[] {
  const changes: ImportChange[] = [];

  if (row.task_name.trim() !== current.task_name.trim()) {
    changes.push('name');
  }

  if (
    row.task_description !== undefined &&
    (current.task_description ?? '').trim() !== row.task_description
  ) {
    changes.push('description');
  }

  if (
    row.start_date !== undefined &&
    dateToIso(current.start_date) !== row.start_date
  ) {
    changes.push('startDate');
  }

  if (
    row.due_date !== undefined &&
    dateToIso(current.due_date) !== row.due_date
  ) {
    changes.push('dueDate');
  }

  if (current.status !== row.estado) {
    changes.push('status');
  }

  if (
    parentChanged(row, parentIndex, rows, current, knownTaskIds, parentTaskId)
  ) {
    changes.push('parent');
  }

  if (row.responsables !== undefined) {
    if (!sameNames(row.responsables, current.responsibleNames)) {
      changes.push('responsibles');
    }
  }

  return changes;
}

export function planImportRows(
  rows: ParsedActivityRow[],
  parentIndexes: (number | null)[],
  currentTasks: Map<number, CurrentTaskSnapshot>,
  parentTaskId: number | null = null,
): PlanImportResult {
  const knownTaskIds = new Set(currentTasks.keys());
  const plans: ImportRowPlan[] = [];
  const warnings: ImportRowWarning[] = [];

  rows.forEach((row, index) => {
    const parentIndex = parentIndexes[index] ?? null;
    const current =
      row.existing_task_id != null
        ? currentTasks.get(row.existing_task_id)
        : undefined;

    if (row.existing_task_id != null && !current) {
      warnings.push({
        numeroFila: row.numeroFila,
        mensaje: `El ID ${row.existing_task_id} no pertenece a este proyecto; la fila se creará como tarea nueva.`,
      });
    }

    if (!current) {
      plans.push({
        row,
        action: 'crear',
        changes: [],
        parentIndex,
        needsResponsibleResolution: (row.responsables?.length ?? 0) > 0,
      });
      return;
    }

    const changes = diffExistingTask(
      row,
      current,
      parentIndex,
      rows,
      knownTaskIds,
      parentTaskId,
    );
    const action: ImportAction = changes.length > 0 ? 'actualizar' : 'omitir';

    plans.push({
      row,
      action,
      changes,
      parentIndex,
      existingTask: current,
      needsResponsibleResolution:
        action === 'actualizar' && changes.includes('responsibles'),
    });
  });

  return { plans, warnings };
}
