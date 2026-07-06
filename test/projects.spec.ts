import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../src/app/projects/repository/project-repository.interface';
import type { IProjectRepository } from '../src/app/projects/repository/project-repository.interface';
import { PROJECT_RESPONSIBLE_REPOSITORY } from '../src/app/projects/repository/project-responsible-repository.interface';
import type { IProjectResponsibleRepository } from '../src/app/projects/repository/project-responsible-repository.interface';
import { CreateProjectUseCase } from '../src/app/projects/use-cases/create-project.use-case';
import { FindProjectsUseCase } from '../src/app/projects/use-cases/find-projects.use-case';
import { FindProjectUseCase } from '../src/app/projects/use-cases/find-project.use-case';
import { UpdateProjectUseCase } from '../src/app/projects/use-cases/update-project.use-case';
import { DeleteProjectUseCase } from '../src/app/projects/use-cases/delete-project.use-case';
import { CreateResponsibleUseCase } from '../src/app/projects/use-cases/create-responsible.use-case';
import { FindResponsiblesUseCase } from '../src/app/projects/use-cases/find-responsibles.use-case';
import { RemoveResponsibleUseCase } from '../src/app/projects/use-cases/remove-responsible.use-case';
import { ProjectEntity } from '../src/app/projects/entities/project.entity';
import { ProjectResponsibleEntity } from '../src/app/projects/entities/project-responsible.entity';
import { Role } from '../src/common/enums/role.enum';
import { PrivacyLevel } from '../src/common/enums/privacy-level.enum';
import { createMock, Mockify } from './helpers/mock-factory';

describe('ProjectsModule', () => {
  let createProjectUseCase: CreateProjectUseCase;
  let findProjectsUseCase: FindProjectsUseCase;
  let findProjectUseCase: FindProjectUseCase;
  let updateProjectUseCase: UpdateProjectUseCase;
  let deleteProjectUseCase: DeleteProjectUseCase;
  let createResponsibleUseCase: CreateResponsibleUseCase;
  let findResponsiblesUseCase: FindResponsiblesUseCase;
  let removeResponsibleUseCase: RemoveResponsibleUseCase;
  let projectRepo: Mockify<IProjectRepository>;
  let responsibleRepo: Mockify<IProjectResponsibleRepository>;

  beforeAll(async () => {
    projectRepo = createMock<IProjectRepository>([
      'save',
      'findWithPagination',
      'findOneById',
      'update',
      'delete',
      'isUserInSameArea',
      'isUserInSede',
    ]);
    responsibleRepo = createMock<IProjectResponsibleRepository>([
      'findOneByProjectAndUser',
      'create',
      'findByProjectId',
      'delete',
      'countByProjectAndUser',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PROJECT_REPOSITORY, useValue: projectRepo },
        {
          provide: PROJECT_RESPONSIBLE_REPOSITORY,
          useValue: responsibleRepo,
        },
        CreateProjectUseCase,
        FindProjectsUseCase,
        FindProjectUseCase,
        UpdateProjectUseCase,
        DeleteProjectUseCase,
        CreateResponsibleUseCase,
        FindResponsiblesUseCase,
        RemoveResponsibleUseCase,
      ],
    }).compile();

    createProjectUseCase = module.get(CreateProjectUseCase);
    findProjectsUseCase = module.get(FindProjectsUseCase);
    findProjectUseCase = module.get(FindProjectUseCase);
    updateProjectUseCase = module.get(UpdateProjectUseCase);
    deleteProjectUseCase = module.get(DeleteProjectUseCase);
    createResponsibleUseCase = module.get(CreateResponsibleUseCase);
    findResponsiblesUseCase = module.get(FindResponsiblesUseCase);
    removeResponsibleUseCase = module.get(RemoveResponsibleUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createProject', () => {
    it('should create and return a project', async () => {
      const dto = { name_project: 'Test', manager_id: 1 };
      const saved = new ProjectEntity();
      saved.id_project = 1;
      saved.name_project = 'Test';
      projectRepo.save.mockResolvedValue(saved);

      const result = await createProjectUseCase.execute(dto);

      expect(projectRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name_project: 'Test' }),
      );
      expect(result).toEqual(saved);
    });

    it('should throw BadRequestException when start_date > due_date', async () => {
      const dto = {
        name_project: 'Test',
        manager_id: 1,
        start_date: '2025-06-01',
        due_date: '2025-05-01',
      };

      await expect(createProjectUseCase.execute(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findProjects', () => {
    it('should return paginated projects', async () => {
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [new ProjectEntity()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      projectRepo.findWithPagination.mockResolvedValue(expected);

      const result = await findProjectsUseCase.execute(query);

      expect(projectRepo.findWithPagination).toHaveBeenCalledWith(
        query,
        undefined,
      );
      expect(result).toEqual(expected);
    });

    it('should pass user to repository for privacy filtering', async () => {
      const query = { page: 1, limit: 20 };
      const user = {
        sub: 1,
        username: 'admin',
        roles: [Role.SUPER_ADMIN],
      };
      projectRepo.findWithPagination.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      await findProjectsUseCase.execute(query, user);

      expect(projectRepo.findWithPagination).toHaveBeenCalledWith(query, user);
    });
  });

  describe('findProject', () => {
    it('should return a project when found', async () => {
      const project = new ProjectEntity();
      project.id_project = 1;
      projectRepo.findOneById.mockResolvedValue(project);

      const result = await findProjectUseCase.execute(1);

      expect(result).toEqual(project);
    });

    it('should throw NotFoundException when not found', async () => {
      projectRepo.findOneById.mockResolvedValue(null);

      await expect(findProjectUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow SUPER_ADMIN to see any project', async () => {
      const project = new ProjectEntity();
      project.id_project = 1;
      project.privacy_level = PrivacyLevel.PRIVADO;
      projectRepo.findOneById.mockResolvedValue(project);

      const result = await findProjectUseCase.execute(1, {
        sub: 2,
        username: 'admin',
        roles: [Role.SUPER_ADMIN],
      });

      expect(result).toEqual(project);
    });

    it('should block non-admin from PRIVADO project', async () => {
      const project = new ProjectEntity();
      project.id_project = 1;
      project.privacy_level = PrivacyLevel.PRIVADO;
      project.manager_id = 1;
      projectRepo.findOneById.mockResolvedValue(project);

      await expect(
        findProjectUseCase.execute(1, {
          sub: 2,
          username: 'user',
          roles: [Role.PERSONAL],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow manager to see PRIVADO project', async () => {
      const project = new ProjectEntity();
      project.id_project = 1;
      project.privacy_level = PrivacyLevel.PRIVADO;
      project.manager_id = 1;
      projectRepo.findOneById.mockResolvedValue(project);

      const result = await findProjectUseCase.execute(1, {
        sub: 1,
        username: 'manager',
        roles: [Role.PERSONAL],
      });

      expect(result).toEqual(project);
    });
  });

  describe('updateProject', () => {
    it('should update and return the project', async () => {
      const updated = new ProjectEntity();
      updated.id_project = 1;
      updated.name_project = 'Updated';
      projectRepo.update.mockResolvedValue(undefined);
      projectRepo.findOneById.mockResolvedValue(updated);

      const result = await updateProjectUseCase.execute(1, {
        name_project: 'Updated',
      });

      expect(projectRepo.update).toHaveBeenCalledWith(1, {
        name_project: 'Updated',
      });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      const project = new ProjectEntity();
      project.id_project = 1;
      projectRepo.findOneById.mockResolvedValue(project);

      await deleteProjectUseCase.execute(1);

      expect(projectRepo.delete).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException when not found', async () => {
      projectRepo.findOneById.mockResolvedValue(null);

      await expect(deleteProjectUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createResponsible', () => {
    it('should create a responsible', async () => {
      responsibleRepo.findOneByProjectAndUser.mockResolvedValue(null);
      const entity = new ProjectResponsibleEntity();
      entity.project_id = 1;
      entity.user_id = 2;
      responsibleRepo.create.mockResolvedValue(entity);

      const result = await createResponsibleUseCase.execute({
        project_id: 1,
        user_id: 2,
      });

      expect(responsibleRepo.create).toHaveBeenCalledWith({
        project_id: 1,
        user_id: 2,
      });
      expect(result).toEqual(entity);
    });

    it('should throw ConflictException when already responsible', async () => {
      const existing = new ProjectResponsibleEntity();
      responsibleRepo.findOneByProjectAndUser.mockResolvedValue(existing);

      await expect(
        createResponsibleUseCase.execute({ project_id: 1, user_id: 2 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findResponsibles', () => {
    it('should return responsibles for a project', async () => {
      const list = [new ProjectResponsibleEntity()];
      responsibleRepo.findByProjectId.mockResolvedValue(list);

      const result = await findResponsiblesUseCase.execute(1);

      expect(result).toEqual(list);
    });
  });

  describe('removeResponsible', () => {
    it('should remove an existing responsible', async () => {
      const entity = new ProjectResponsibleEntity();
      responsibleRepo.findOneByProjectAndUser.mockResolvedValue(entity);

      await removeResponsibleUseCase.execute(1, 2);

      expect(responsibleRepo.delete).toHaveBeenCalledWith(entity);
    });

    it('should throw NotFoundException when not found', async () => {
      responsibleRepo.findOneByProjectAndUser.mockResolvedValue(null);

      await expect(removeResponsibleUseCase.execute(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
