import {
  buildResponsibleResolver,
  listResponsibleNames,
  normalizePersonName,
  ResponsibleUser,
} from './import-responsibles';

const USERS: ResponsibleUser[] = [
  {
    id_user: 'u1',
    name: 'Ana',
    apellido_paterno: 'López',
    apellido_materno: 'Ruiz',
  },
  {
    id_user: 'u2',
    name: 'Luis',
    apellido_paterno: 'Gómez',
    apellido_materno: null,
  },
  {
    id_user: 'u3',
    name: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'Díaz',
  },
  {
    id_user: 'u4',
    name: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'Soto',
  },
  {
    id_user: 'u5',
    name: 'Pedro',
    apellido_paterno: null,
    apellido_materno: null,
  },
  {
    id_user: 'u6',
    name: 'Javier Enrique',
    apellido_paterno: 'García',
    apellido_materno: null,
  },
];

describe('normalizePersonName', () => {
  it('quita acentos, mayúsculas y espacios extra', () => {
    expect(normalizePersonName('  JUAN   Pérez ')).toBe('juan perez');
    expect(normalizePersonName('Ana López')).toBe('ana lopez');
  });
});

describe('buildResponsibleResolver', () => {
  const resolver = buildResponsibleResolver(USERS);

  it('resuelve por nombre + apellido paterno, sin importar acentos o mayúsculas', () => {
    expect(resolver.resolve('ANA LOPEZ')).toEqual({ ids: ['u1'], errors: [] });
    expect(resolver.resolve('luis gomez')).toEqual({ ids: ['u2'], errors: [] });
  });

  it('resuelve por nombre completo (con apellido materno)', () => {
    expect(resolver.resolve('Ana López Ruiz')).toEqual({
      ids: ['u1'],
      errors: [],
    });
    expect(resolver.resolve('Juan Pérez Díaz')).toEqual({
      ids: ['u3'],
      errors: [],
    });
  });

  it('resuelve por solo nombre cuando no hay apellidos', () => {
    expect(resolver.resolve('Pedro')).toEqual({ ids: ['u5'], errors: [] });
  });

  it('reporta ambiguo cuando el nombre corto coincide con varios usuarios', () => {
    const { ids, errors } = resolver.resolve('Juan Pérez');
    expect(ids).toEqual([]);
    expect(errors).toEqual([
      'Responsable ambiguo (varios usuarios): Juan Pérez',
    ]);
  });

  it('reporta no encontrado', () => {
    const { ids, errors } = resolver.resolve('Nadie Existe');
    expect(ids).toEqual([]);
    expect(errors).toEqual(['Responsable no encontrado: Nadie Existe']);
  });

  it('resuelve varios responsables separados por coma', () => {
    expect(resolver.resolve('Ana López, Luis Gómez')).toEqual({
      ids: ['u1', 'u2'],
      errors: [],
    });
  });

  it('deduplica responsables repetidos', () => {
    expect(resolver.resolve('Ana López, ana lopez')).toEqual({
      ids: ['u1'],
      errors: [],
    });
  });

  it('devuelve vacío para una celda vacía', () => {
    expect(resolver.resolve('')).toEqual({ ids: [], errors: [] });
    expect(resolver.resolve('   ')).toEqual({ ids: [], errors: [] });
  });

  it('sugiere nombres parecidos cuando no encuentra el responsable', () => {
    const { ids, errors } = resolver.resolve('Javier Garcia');
    expect(ids).toEqual([]);
    expect(errors[0]).toContain('Responsable no encontrado: Javier Garcia');
    expect(errors[0]).toContain('Javier Enrique García');
  });
});

describe('listResponsibleNames', () => {
  it('devuelve nombres únicos, ordenados y sin ambiguos', () => {
    const names = listResponsibleNames(USERS);

    expect(names).toContain('Ana López');
    expect(names).toContain('Pedro');
    expect(names).toContain('Javier Enrique García');
    // "Juan Pérez" es ambiguo (u3/u4) -> se excluye.
    expect(names).not.toContain('Juan Pérez');

    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'es'));
    expect(names).toEqual(sorted);
  });
});
