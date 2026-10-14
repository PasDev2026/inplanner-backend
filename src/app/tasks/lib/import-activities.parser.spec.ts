import ExcelJS from 'exceljs';
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

  it('parsea fechas (ISO y DD/MM/AAAA) y reporta fechas inválidas', () => {
    const result = parseActivityRows([
      row(2, {
        tarea: 'Con fechas ISO',
        nivel: '1',
        'fecha inicio': '2026-09-29',
        'fecha vencimiento': '2026-10-15',
      }),
      row(3, { tarea: 'Con fecha LatAm', 'fecha inicio': '29/09/2026' }),
      row(4, { tarea: 'Fecha mala', 'fecha inicio': '32/13/2026' }),
    ]);

    expect(result.filas).toEqual([
      {
        numeroFila: 2,
        task_name: 'Con fechas ISO',
        task_description: undefined,
        nivel: 1,
        start_date: '2026-09-29',
        due_date: '2026-10-15',
        estado: 0,
      },
      {
        numeroFila: 3,
        task_name: 'Con fecha LatAm',
        task_description: undefined,
        nivel: 1,
        start_date: '2026-09-29',
        due_date: undefined,
        estado: 0,
      },
    ]);
    expect(result.errores).toEqual([
      {
        numeroFila: 4,
        mensaje: 'Fecha inicio inválida: usa AAAA-MM-DD o DD/MM/AAAA',
      },
    ]);
  });

  it('parsea responsables (varios separados por coma o punto y coma)', () => {
    const result = parseActivityRows([
      row(2, { tarea: 'Con uno', responsable: 'Juan Pérez' }),
      row(3, {
        tarea: 'Con varios',
        responsables: 'Ana López, Luis Gómez; Pedro Díaz',
      }),
      row(4, { tarea: 'Sin responsable' }),
    ]);

    expect(result.errores).toEqual([]);
    expect(result.filas[0].responsables).toEqual(['Juan Pérez']);
    expect(result.filas[1].responsables).toEqual([
      'Ana López',
      'Luis Gómez',
      'Pedro Díaz',
    ]);
    expect(result.filas[2].responsables).toBeUndefined();
  });

  it('une Responsable y Responsable 2', () => {
    const result = parseActivityRows([
      row(2, {
        tarea: 'Con dos',
        responsable: 'Ana López',
        'responsable 2': 'Luis Gómez',
      }),
      row(3, { tarea: 'Solo el segundo', 'responsable 2': 'Pedro Díaz' }),
    ]);

    expect(result.errores).toEqual([]);
    expect(result.filas[0].responsables).toEqual(['Ana López', 'Luis Gómez']);
    expect(result.filas[1].responsables).toEqual(['Pedro Díaz']);
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

  it('lee fechas desde CSV', async () => {
    const csv = [
      'Tarea;Nivel;Fecha inicio;Fecha vencimiento;Estado',
      'Con fechas;1;2026-09-29;2026-10-15;En progreso',
    ].join('\n');

    const result = await parseActivitiesWorkbook(
      Buffer.from(csv, 'utf8'),
      'actividades.csv',
    );

    expect(result.errores).toEqual([]);
    expect(result.filas[0]).toEqual({
      numeroFila: 2,
      task_name: 'Con fechas',
      task_description: undefined,
      nivel: 1,
      start_date: '2026-09-29',
      due_date: '2026-10-15',
      estado: 2,
    });
  });

  it('lee celdas de fecha reales (tipo Date) de un xlsx', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Actividades');
    ws.addRow([
      'Tarea',
      'Nivel',
      'Fecha inicio',
      'Fecha vencimiento',
      'Estado',
    ]);
    ws.addRow([
      'Con fecha',
      1,
      new Date(Date.UTC(2026, 8, 29)),
      new Date(Date.UTC(2026, 9, 15)),
      'Pendiente',
    ]);
    const buffer = (await wb.xlsx.writeBuffer()) as unknown as Buffer;

    const result = await parseActivitiesWorkbook(buffer, 'actividades.xlsx');

    expect(result.errores).toEqual([]);
    expect(result.filas[0]).toEqual({
      numeroFila: 2,
      task_name: 'Con fecha',
      task_description: undefined,
      nivel: 1,
      start_date: '2026-09-29',
      due_date: '2026-10-15',
      estado: 0,
    });
  });
});
