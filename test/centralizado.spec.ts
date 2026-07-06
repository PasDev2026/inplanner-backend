import { Test, TestingModule } from '@nestjs/testing';
import { CENTRALIZADO_REPOSITORY } from '../src/app/centralizado/repository/centralizado-repository.interface';
import type { ICentralizadoRepository } from '../src/app/centralizado/repository/centralizado-repository.interface';
import { CentralizadoService } from '../src/app/centralizado/centralizado.service';
import { RolEntity } from '../src/app/centralizado/entities/rol.entity';
import { SedeEntity } from '../src/app/centralizado/entities/sede.entity';
import { createMock, Mockify } from './helpers/mock-factory';

describe('CentralizadoModule', () => {
  let service: CentralizadoService;
  let repo: Mockify<ICentralizadoRepository>;

  beforeAll(async () => {
    repo = createMock<ICentralizadoRepository>([
      'findActiveRoles',
      'findActiveSedes',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: CENTRALIZADO_REPOSITORY, useValue: repo },
        CentralizadoService,
      ],
    }).compile();

    service = module.get(CentralizadoService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return mapped roles and sedes', async () => {
    const rol = new RolEntity();
    rol.id_rol = 1;
    rol.nom_rol = 'ADMIN';
    const sede = new SedeEntity();
    sede.id_sede = 10;
    sede.nom_sede = 'INSALUD Sede Central';

    repo.findActiveRoles.mockResolvedValue([rol]);
    repo.findActiveSedes.mockResolvedValue([sede]);

    const result = await service.findAll();

    expect(repo.findActiveRoles).toHaveBeenCalled();
    expect(repo.findActiveSedes).toHaveBeenCalled();
    expect(result).toEqual({
      roles: [{ id: 1, nombre: 'ADMIN' }],
      sedes: [{ id: 10, nombre: 'Sede Central' }],
    });
  });

  it('should return empty arrays when no data', async () => {
    repo.findActiveRoles.mockResolvedValue([]);
    repo.findActiveSedes.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual({ roles: [], sedes: [] });
  });
});
