import { UserEntity } from '../../users/entities/user.entity';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { TaskEntity } from '../entities/task.entity';
import { parseActivitiesWorkbook } from './import-activities.parser';
import { buildResponsibleLabels } from './import-responsibles';
import { buildProjectExportBuffer } from './import-template';
import { buildProjectExportRows } from './project-export';

function user(
  id: string,
  name: string,
  paterno: string | null,
  materno: string | null = null,
): UserEntity {
  return {
    id_user: id,
    name,
    apellido_paterno: paterno,
    apellido_materno: materno,
    numero_documento: `doc-${id}`,
    email: `${id}@example.com`,
    estado: true,
  } as UserEntity;
}

function task(
  overrides: Partial<TaskEntity> & { id_task: number },
): TaskEntity {
  return {
    task_name: 'Tarea',
    task_description: null,
    status: 0,
    start_date: null,
    due_date: null,
    parent_task_id: null,
    position: 1000,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    assignments: [],
    ...overrides,
  } as TaskEntity;
}

function assignment(
  taskId: number,
  assignedUser: UserEntity,
): TaskAssignmentEntity {
  return {
    task_id: taskId,
    user_id: assignedUser.id_user,
    user: assignedUser,
  } as TaskAssignmentEntity;
}

describe('buildProjectExportRows', () => {
  it('ordena la jerarquía, calcula niveles y mapea estado, fechas y responsables', () => {
    const ana = user('u1', 'Ana', 'López', 'Ruiz');
    const luis = user('u2', 'Luis', 'Gómez');
    const labels = buildResponsibleLabels([ana, luis]);

    const rows = buildProjectExportRows(
      [
        task({
          id_task: 2,
          task_name: 'Hija',
          parent_task_id: 1,
          position: 500,
          status: 4,
          assignments: [assignment(2, ana), assignment(2, luis)],
        }),
        task({
          id_task: 1,
          task_name: 'Padre',
          position: 1000,
          status: 2,
          start_date: new Date('2026-09-29T00:00:00.000Z'),
          due_date: new Date('2026-10-15T00:00:00.000Z'),
          assignments: [assignment(1, ana)],
        }),
        task({ id_task: 3, task_name: 'Otra raíz', position: 500 }),
      ],
      labels,
    );

    expect(rows.map((row) => [row.name, row.level])).toEqual([
      ['Otra raíz', 1],
      ['Padre', 1],
      ['Hija', 2],
    ]);

    const padre = rows[1];
    expect(padre).toMatchObject({
      id: 1,
      status: 2,
      startDate: '2026-09-29',
      dueDate: '2026-10-15',
      responsible: 'Ana López Ruiz',
      responsible2: '',
    });

    const hija = rows[2];
    expect(hija).toMatchObject({
      id: 2,
      status: 4,
      startDate: '',
      dueDate: '',
      responsible: 'Ana López Ruiz',
      responsible2: 'Luis Gómez',
    });
  });

  it('genera un Excel que el parser puede volver a leer (round-trip)', async () => {
    const ana = user('u1', 'Ana', 'López', 'Ruiz');
    const labels = buildResponsibleLabels([ana]);
    const rows = buildProjectExportRows(
      [
        task({
          id_task: 1,
          task_name: 'Padre',
          status: 2,
          start_date: new Date('2026-09-29T00:00:00.000Z'),
          due_date: new Date('2026-10-15T00:00:00.000Z'),
          assignments: [assignment(1, ana)],
        }),
        task({
          id_task: 2,
          task_name: 'Hija',
          parent_task_id: 1,
          status: 4,
        }),
      ],
      labels,
    );

    const buffer = await buildProjectExportBuffer(rows, ['Ana López Ruiz']);
    const parsed = await parseActivitiesWorkbook(buffer, 'export.xlsx');

    expect(parsed.errores).toEqual([]);
    expect(
      parsed.filas.map((fila) => ({
        id: fila.existing_task_id,
        name: fila.task_name,
        nivel: fila.nivel,
        estado: fila.estado,
        start: fila.start_date,
        due: fila.due_date,
        responsables: fila.responsables,
      })),
    ).toEqual([
      {
        id: 1,
        name: 'Padre',
        nivel: 1,
        estado: 2,
        start: '2026-09-29',
        due: '2026-10-15',
        responsables: ['Ana López Ruiz'],
      },
      {
        id: 2,
        name: 'Hija',
        nivel: 2,
        estado: 4,
        start: undefined,
        due: undefined,
        responsables: undefined,
      },
    ]);
  });
});
