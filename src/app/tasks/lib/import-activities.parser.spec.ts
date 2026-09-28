import {
  ParsedActivityRow,
  parseActivitiesWorkbook,
  parseActivityRows,
  resolveHierarchy,
} from './import-activities.parser';

function row(numeroFila: number, data: Record<string, unknown>) {
  return { numeroFila, data };
}

describe('parseActivityRows', () => {
  it('mapea encabezados (tarea/nombre), nivel y estado por nombre o número', () => {
    const result = parseActivityRows([
      row(2, {
        tarea: 'Actividad A',
        descripcion: 'detalle',
        nivel: '1',
        estado: '2',
      }),
      row(3, { nombre: 'Actividad B', nivel: '', estado: 'En Revisión' }),
      row(4, { tarea: 'Actividad C', estado: 4 }),
    ]);

    expect(result.errores).toEqual([]);
    expect(result.ignoradas).toBe(0);
    expect(result.filas).toEqual([
      {
        numeroFila: 2,
        task_name: 'Actividad A',
        task_description: 'detalle',
        nivel: 1,
        estado: 2,
      },
      {
        numeroFila: 3,
        task_name: 'Actividad B',
        task_description: undefined,
        nivel: 1,
        estado: 3,
      },
      {
        numeroFila: 4,
        task_name: 'Actividad C',
        task_description: undefined,
        nivel: 1,
        estado: 4,
      },
    ]);
  });

  it('cuenta las filas vacías como ignoradas', () => {
    const result = parseActivityRows([
      row(2, {}),
      row(3, { tarea: 'ok' }),
      row(4, {}),
    ]);

    expect(result.ignoradas).toBe(2);
    expect(result.filas).toHaveLength(1);
    expect(result.errores).toEqual([]);
  });

  it('reporta errores exactos por fila', () => {
    const result = parseActivityRows([
      row(2, { descripcion: 'sin nombre' }),
      row(3, { tarea: 'x'.repeat(200) }),
      row(4, { tarea: 'ok', nivel: '0' }),
      row(5, { tarea: 'ok', estado: 'inventado' }),
    ]);

    expect(result.filas).toEqual([]);
    expect(result.errores).toEqual([
      { numeroFila: 2, mensaje: 'falta la columna Tarea' },
      {
        numeroFila: 3,
        mensaje: 'la tarea supera los 150 caracteres',
      },
      {
        numeroFila: 4,
        mensaje: 'Nivel inválido: usa un número entero mayor o igual a 1',
      },
      {
        numeroFila: 5,
        mensaje:
          'Estado inválido: usa Pendiente, En espera, En progreso, En revisión, Completado o un número del 0 al 4',
      },
    ]);
  });
});

describe('resolveHierarchy', () => {
  const activity = (nivel: number): ParsedActivityRow => ({
    numeroFila: 0,
    task_name: 'x',
    nivel,
    estado: 0,
  });

  it('resuelve una lista plana', () => {
    expect(resolveHierarchy([activity(1), activity(1)]).parentIndexes).toEqual([
      null,
      null,
    ]);
  });

  it('anida por nivel y reanuda el padre correcto', () => {
    const { parentIndexes, nivelesEfectivos } = resolveHierarchy([
      activity(1),
      activity(2),
      activity(2),
      activity(3),
      activity(1),
    ]);

    expect(parentIndexes).toEqual([null, 0, 0, 2, null]);
    expect(nivelesEfectivos).toEqual([1, 2, 2, 3, 1]);
  });

  it('corrige saltos de nivel y primera fila profunda', () => {
    const { parentIndexes, nivelesEfectivos } = resolveHierarchy([
      activity(3),
      activity(3),
    ]);

    expect(parentIndexes).toEqual([null, 0]);
    expect(nivelesEfectivos).toEqual([1, 2]);
  });
});

describe('parseActivitiesWorkbook', () => {
  it('lee un CSV separado por punto y coma', async () => {
    const csv = [
      'Tarea;Descripcion;Nivel;Estado',
      'Planificación del día;Revisar pendientes;1;Completado',
      'Revisar correos;;2;En espera',
    ].join('\n');

    const result = await parseActivitiesWorkbook(
      Buffer.from(csv, 'utf8'),
      'actividades.csv',
    );

    expect(result.errores).toEqual([]);
    expect(result.filas).toEqual([
      {
        numeroFila: 2,
        task_name: 'Planificación del día',
        task_description: 'Revisar pendientes',
        nivel: 1,
        estado: 4,
      },
      {
        numeroFila: 3,
        task_name: 'Revisar correos',
        task_description: undefined,
        nivel: 2,
        estado: 1,
      },
    ]);
  });

  it('reporta error de encabezado cuando falta la columna Tarea', async () => {
    const csv = ['Descripcion;Nivel', 'algo;1'].join('\n');

    const result = await parseActivitiesWorkbook(
      Buffer.from(csv, 'utf8'),
      'actividades.csv',
    );

    expect(result.filas).toEqual([]);
    expect(result.errores[0].numeroFila).toBe(1);
  });
});
