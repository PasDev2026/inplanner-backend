import {
  ParsedActivityRow,
  resolveHierarchy,
} from './import-activities.parser';
import {
  CurrentTaskSnapshot,
  filterDuplicateIds,
  planImportRows,
} from './import-diff';

function row(
  overrides: Partial<ParsedActivityRow> & { numeroFila: number },
): ParsedActivityRow {
  return {
    task_name: 'Tarea',
    nivel: 1,
    estado: 0,
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<CurrentTaskSnapshot> & { id_task: number },
): CurrentTaskSnapshot {
  return {
    task_name: 'Tarea',
    task_description: null,
    status: 0,
    start_date: null,
    due_date: null,
    parent_task_id: null,
    responsibleNames: [],
    ...overrides,
  };
}

const UNCHANGED_CURRENT = snapshot({
  id_task: 1,
  task_name: 'Tarea',
  task_description: 'desc',
  status: 2,
  start_date: new Date('2026-09-29T00:00:00.000Z'),
  due_date: new Date('2026-10-15T00:00:00.000Z'),
  responsibleNames: ['Ana López'],
});

const UNCHANGED_ROW = row({
  numeroFila: 2,
  existing_task_id: 1,
  task_name: 'Tarea',
  task_description: 'desc',
  start_date: '2026-09-29',
  due_date: '2026-10-15',
  responsables: ['Ana López'],
  estado: 2,
});

describe('filterDuplicateIds', () => {
  it('reporta IDs repetidos y conserva solo la primera fila', () => {
    const result = filterDuplicateIds([
      row({ numeroFila: 2, existing_task_id: 1 }),
      row({ numeroFila: 3, existing_task_id: 1 }),
    ]);

    expect(result.rows.map((r) => r.numeroFila)).toEqual([2]);
    expect(result.errors).toEqual([
      { numeroFila: 3, mensaje: 'ID 1 repetido (también en la fila 2)' },
    ]);
  });
});

describe('planImportRows', () => {
  it('omite una fila existente que no cambió', () => {
    const result = planImportRows(
      [UNCHANGED_ROW],
      [null],
      new Map([[1, UNCHANGED_CURRENT]]),
    );

    expect(result.plans[0].action).toBe('omitir');
    expect(result.plans[0].changes).toEqual([]);
    expect(result.plans[0].needsResponsibleResolution).toBe(false);
  });

  it('actualiza los campos que cambiaron', () => {
    const edited = row({
      ...UNCHANGED_ROW,
      task_name: 'Tarea editada',
      task_description: 'otra desc',
      start_date: '2026-10-01',
      due_date: '2026-10-20',
      responsables: ['Luis Gómez'],
      estado: 4,
    });

    const result = planImportRows(
      [edited],
      [null],
      new Map([[1, UNCHANGED_CURRENT]]),
    );

    expect(result.plans[0].action).toBe('actualizar');
    expect(result.plans[0].changes).toEqual([
      'name',
      'description',
      'startDate',
      'dueDate',
      'status',
      'responsibles',
    ]);
    expect(result.plans[0].needsResponsibleResolution).toBe(true);
  });

  it('no borra datos cuando las celdas opcionales están vacías', () => {
    const sparse = row({
      numeroFila: 2,
      existing_task_id: 1,
      task_name: 'Tarea',
      estado: 2,
    });

    const result = planImportRows(
      [sparse],
      [null],
      new Map([[1, UNCHANGED_CURRENT]]),
    );

    expect(result.plans[0].action).toBe('omitir');
    expect(result.plans[0].changes).toEqual([]);
  });

  it('crea una fila sin ID y resuelve sus responsables', () => {
    const result = planImportRows(
      [row({ numeroFila: 2, responsables: ['Ana López'] })],
      [null],
      new Map(),
    );

    expect(result.plans[0].action).toBe('crear');
    expect(result.plans[0].needsResponsibleResolution).toBe(true);
  });

  it('crea como nueva una fila cuyo ID no pertenece al proyecto', () => {
    const result = planImportRows(
      [row({ numeroFila: 2, existing_task_id: 999, task_name: 'Fantasma' })],
      [null],
      new Map(),
    );

    expect(result.plans[0].action).toBe('crear');
    expect(result.warnings).toEqual([
      {
        numeroFila: 2,
        mensaje:
          'El ID 999 no pertenece a este proyecto; la fila se creará como tarea nueva.',
      },
    ]);
  });

  it('detecta un cambio de padre', () => {
    const rows = [
      row({ numeroFila: 2, existing_task_id: 1, task_name: 'A', nivel: 1 }),
      row({ numeroFila: 3, existing_task_id: 2, task_name: 'B', nivel: 2 }),
    ];
    const { parentIndexes } = resolveHierarchy(rows);
    const current = new Map([
      [1, snapshot({ id_task: 1, task_name: 'A' })],
      [2, snapshot({ id_task: 2, task_name: 'B', parent_task_id: null })],
    ]);

    const result = planImportRows(rows, parentIndexes, current);

    expect(result.plans[0].action).toBe('omitir');
    expect(result.plans[1].action).toBe('actualizar');
    expect(result.plans[1].changes).toEqual(['parent']);
  });

  it('marca cambio de padre cuando el padre es una fila nueva', () => {
    const rows = [
      row({ numeroFila: 2, task_name: 'Nueva', nivel: 1 }),
      row({ numeroFila: 3, existing_task_id: 2, task_name: 'B', nivel: 2 }),
    ];
    const { parentIndexes } = resolveHierarchy(rows);
    const current = new Map([
      [2, snapshot({ id_task: 2, task_name: 'B', parent_task_id: null })],
    ]);

    const result = planImportRows(rows, parentIndexes, current);

    expect(result.plans[0].action).toBe('crear');
    expect(result.plans[1].action).toBe('actualizar');
    expect(result.plans[1].changes).toEqual(['parent']);
  });
});
