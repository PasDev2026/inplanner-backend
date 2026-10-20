import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExportProjectTasksUseCase } from './export-project-tasks.use-case';
import { ProjectEntity } from '../../projects/entities/project.entity';
import type { ITaskRepository } from '../repository/task-repository.interface';
import type { JwtPayload, UserSede } from '../../auth/interfaces/auth-types';

const PROJECT = {
  id_project: 1,
  name_project: 'Proyecto Demo',
  manager_id: 'manager-1',
} as ProjectEntity;

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

function buildUseCase(project: ProjectEntity | null = PROJECT) {
  const taskRepo = {
    findByProjectWithAssignments: jest.fn().mockResolvedValue([]),
  } as unknown as ITaskRepository;

  const projectRepo = {
    findOne: jest.fn().mockResolvedValue(project),
  };
  const userRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) =>
      entity === ProjectEntity ? projectRepo : userRepo,
    ),
  } as unknown as DataSource;

  return new ExportProjectTasksUseCase(taskRepo, dataSource);
}

describe('ExportProjectTasksUseCase', () => {
  it('exporta cuando el usuario es manager del proyecto', async () => {
    const result = await buildUseCase().execute(1, user('manager-1'));

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('Actividades_');
  });

  it('exporta cuando el usuario es superadmin aunque no sea manager', async () => {
    const result = await buildUseCase().execute(
      1,
      user('otro-usuario', 'SUPER_ADMINISTRADOR'),
    );

    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('rechaza a un usuario que no es manager ni superadmin', async () => {
    await expect(
      buildUseCase().execute(1, user('otro-usuario')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza NotFound si el proyecto no existe', async () => {
    await expect(
      buildUseCase(null).execute(99, user('manager-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
