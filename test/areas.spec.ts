import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AREA_REPOSITORY } from '../src/app/areas/repository/area-repository.interface';
import type { IAreaRepository } from '../src/app/areas/repository/area-repository.interface';
import { CreateAreaUseCase } from '../src/app/areas/use-cases/create-area.use-case';
import { FindAreasUseCase } from '../src/app/areas/use-cases/find-areas.use-case';
import { FindAreaUseCase } from '../src/app/areas/use-cases/find-area.use-case';
import { UpdateAreaUseCase } from '../src/app/areas/use-cases/update-area.use-case';
import { DeleteAreaUseCase } from '../src/app/areas/use-cases/delete-area.use-case';
import { AreaEntity } from '../src/app/areas/entities/area.entity';
import { createMock, Mockify } from './helpers/mock-factory';

describe('AreasModule', () => {
  let createUseCase: CreateAreaUseCase;
  let findAreasUseCase: FindAreasUseCase;
  let findAreaUseCase: FindAreaUseCase;
  let updateUseCase: UpdateAreaUseCase;
  let deleteUseCase: DeleteAreaUseCase;
  let repo: Mockify<IAreaRepository>;

  beforeAll(async () => {
    repo = createMock<IAreaRepository>([
      'save',
      'findWithPagination',
      'findOneById',
      'findByName',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AREA_REPOSITORY, useValue: repo },
        CreateAreaUseCase,
        FindAreasUseCase,
        FindAreaUseCase,
        UpdateAreaUseCase,
        DeleteAreaUseCase,
      ],
    }).compile();

    createUseCase = module.get(CreateAreaUseCase);
    findAreasUseCase = module.get(FindAreasUseCase);
    findAreaUseCase = module.get(FindAreaUseCase);
    updateUseCase = module.get(UpdateAreaUseCase);
    deleteUseCase = module.get(DeleteAreaUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create and return an area', async () => {
      repo.findByName.mockResolvedValue(null);
      const dto = { nombre_area: 'Test Area' };
      const saved = new AreaEntity();
      saved.id_area = 1;
      saved.nombre_area = 'Test Area';
      repo.save.mockResolvedValue(saved);

      const result = await createUseCase.execute(dto);

      expect(repo.findByName).toHaveBeenCalledWith('Test Area');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nombre_area: 'Test Area' }),
      );
      expect(result).toEqual(saved);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const existing = new AreaEntity();
      existing.nombre_area = 'Duplicated';
      repo.findByName.mockResolvedValue(existing);

      await expect(
        createUseCase.execute({ nombre_area: 'Duplicated' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated areas', async () => {
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [new AreaEntity()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      repo.findWithPagination.mockResolvedValue(expected);

      const result = await findAreasUseCase.execute(query);

      expect(repo.findWithPagination).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return an area when found', async () => {
      const area = new AreaEntity();
      area.id_area = 1;
      area.nombre_area = 'Test';
      repo.findOneById.mockResolvedValue(area);

      const result = await findAreaUseCase.execute(1);

      expect(result).toEqual(area);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(findAreaUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(findAreaUseCase.execute(999)).rejects.toThrow(
        /999.*no encontrada/,
      );
    });
  });

  describe('update', () => {
    it('should update and return the area', async () => {
      const existing = new AreaEntity();
      existing.id_area = 1;
      existing.nombre_area = 'Old Name';
      existing.estado = true;
      repo.findOneById.mockResolvedValue(existing);
      repo.findByName.mockResolvedValue(null);
      repo.save.mockResolvedValue({ ...existing, nombre_area: 'New Name' });

      const result = await updateUseCase.execute(1, {
        nombre_area: 'New Name',
      });

      expect(repo.findOneById).toHaveBeenCalledWith(1);
      expect(repo.save).toHaveBeenCalled();
      expect(result.nombre_area).toBe('New Name');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const existing = new AreaEntity();
      existing.id_area = 1;
      existing.nombre_area = 'Old Name';
      repo.findOneById.mockResolvedValue(existing);
      const duplicate = new AreaEntity();
      duplicate.id_area = 2;
      duplicate.nombre_area = 'Taken Name';
      repo.findByName.mockResolvedValue(duplicate);

      await expect(
        updateUseCase.execute(1, { nombre_area: 'Taken Name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(
        updateUseCase.execute(999, { nombre_area: 'Whatever' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft-delete an area', async () => {
      const area = new AreaEntity();
      area.id_area = 1;
      area.nombre_area = 'Test';
      area.estado = true;
      repo.findOneById.mockResolvedValue(area);
      repo.save.mockResolvedValue({ ...area, estado: false });

      await deleteUseCase.execute(1);

      expect(area.estado).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(area);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(deleteUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
