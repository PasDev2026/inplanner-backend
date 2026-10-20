import { orderTasksByHierarchy } from './task-hierarchy';

interface TestTask {
  id_task: number;
  parent_task_id: number | null;
  position: number;
  created_at: string;
  name: string;
}

const task = (
  id: number,
  parent: number | null,
  position: number,
  name: string,
): TestTask => ({
  id_task: id,
  parent_task_id: parent,
  position,
  created_at: '2026-01-01T00:00:00.000Z',
  name,
});

describe('orderTasksByHierarchy', () => {
  it('emite padres antes que hijos y calcula el nivel', () => {
    const ordered = orderTasksByHierarchy([
      task(2, 1, 1000, 'hija'),
      task(1, null, 1000, 'padre'),
      task(3, 2, 1000, 'nieta'),
    ]);

    expect(ordered.map(({ task: t, level }) => [t.name, level])).toEqual([
      ['padre', 1],
      ['hija', 2],
      ['nieta', 3],
    ]);
  });

  it('ordena hermanos por position y luego por created_at', () => {
    const ordered = orderTasksByHierarchy([
      task(1, null, 2000, 'segunda'),
      task(2, null, 1000, 'primera'),
      task(3, null, 1000, 'empate'),
    ]);

    expect(ordered.map(({ task: t }) => t.name)).toEqual([
      'primera',
      'empate',
      'segunda',
    ]);
  });

  it('trata como raíz las tareas cuyo padre no está en el conjunto', () => {
    const ordered = orderTasksByHierarchy([task(1, 999, 1000, 'huérfana')]);

    expect(ordered).toHaveLength(1);
    expect(ordered[0].task.id_task).toBe(1);
    expect(ordered[0].level).toBe(1);
  });

  it('no pierde tareas si hay un ciclo de padres', () => {
    const ordered = orderTasksByHierarchy([
      task(1, 2, 1000, 'a'),
      task(2, 1, 1000, 'b'),
    ]);

    expect(ordered.map(({ task: t }) => t.id_task).sort()).toEqual([1, 2]);
  });
});
