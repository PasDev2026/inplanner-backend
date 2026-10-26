import { DataSource } from 'typeorm';
import {
  canAccessProjectActivities,
  isProjectResponsible,
} from './project-access';
import type { JwtPayload, UserSede } from '../../auth/interfaces/auth-types';

const PROJECT = { manager_id: 'manager-1' };

function sede(role: string): UserSede {
  return {
    sede_id: 'sede-1',
    sede_nombre: 'Sede',
    sede_slug: 'sede',
    rol_codigo: role,
  };
}

function user(sub: string, role = 'PERSONAL'): JwtPayload {
  return {
    sub,
    persona_id: 'persona-1',
    numero_documento: '12345678',
    nombres: 'Nombre',
    apellido_paterno: 'Apellido',
    sexo: null,
    fecha_nacimiento: null,
    tipo: 'TRABAJADOR',
    pais_codigo: 'PE',
    sede_activa: sede(role),
    otras_sedes: [],
  };
}

describe('canAccessProjectActivities', () => {
  it('permite al manager del proyecto', () => {
    expect(canAccessProjectActivities(PROJECT, user('manager-1'), false)).toBe(
      true,
    );
  });

  it('permite al superadmin', () => {
    expect(
      canAccessProjectActivities(
        PROJECT,
        user('otro-usuario', 'SUPER_ADMINISTRADOR'),
        false,
      ),
    ).toBe(true);
  });

  it('permite al responsable del proyecto', () => {
    expect(
      canAccessProjectActivities(PROJECT, user('responsable-1'), true),
    ).toBe(true);
  });

  it('rechaza a un usuario ajeno', () => {
    expect(
      canAccessProjectActivities(PROJECT, user('otro-usuario'), false),
    ).toBe(false);
  });
});

describe('isProjectResponsible', () => {
  it('devuelve true si existe la relación proyecto-usuario', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValue({ project_id: 1, user_id: 'responsable-1' });
    const dataSource = {
      getRepository: jest.fn(() => ({ findOne })),
    } as unknown as DataSource;

    await expect(
      isProjectResponsible(dataSource, 1, 'responsable-1'),
    ).resolves.toBe(true);
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project_id: 1, user_id: 'responsable-1' },
      }),
    );
  });

  it('devuelve false si el usuario no es responsable', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const dataSource = {
      getRepository: jest.fn(() => ({ findOne })),
    } as unknown as DataSource;

    await expect(
      isProjectResponsible(dataSource, 1, 'otro-usuario'),
    ).resolves.toBe(false);
  });
});
