import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TASK_REPOSITORY } from '../src/app/tasks/repository/task-repository.interface';
import type { ITaskRepository } from '../src/app/tasks/repository/task-repository.interface';
import { TASK_ASSIGNMENT_REPOSITORY } from '../src/app/tasks/repository/task-assignment-repository.interface';
import type { ITaskAssignmentRepository } from '../src/app/tasks/repository/task-assignment-repository.interface';
import { CreateTaskUseCase } from '../src/app/tasks/use-cases/create-task.use-case';
import { FindTasksUseCase } from '../src/app/tasks/use-cases/find-tasks.use-case';
import { FindTaskUseCase } from '../src/app/tasks/use-cases/find-task.use-case';
import { UpdateTaskUseCase } from '../src/app/tasks/use-cases/update-task.use-case';
import { UpdateTaskStatusUseCase } from '../src/app/tasks/use-cases/update-task-status.use-case';
import { DeleteTaskUseCase } from '../src/app/tasks/use-cases/delete-task.use-case';
import { CreateAssignmentUseCase } from '../src/app/tasks/use-cases/create-assignment.use-case';
import { FindAssignmentsUseCase } from '../src/app/tasks/use-cases/find-assignments.use-case';
import { RemoveAssignmentUseCase } from '../src/app/tasks/use-cases/remove-assignment.use-case';
import { FindChildrenUseCase } from '../src/app/tasks/use-cases/find-children.use-case';
import { TaskEntity } from '../src/app/tasks/entities/task.entity';
import { TaskAssignmentEntity } from '../src/app/tasks/entities/task-assignment.entity';
import { createMock, Mockify } from './helpers/mock-factory';

describe('TasksModule', () => {
  let createTaskUseCase: CreateTaskUseCase;
  let findTasksUseCase: FindTasksUseCase;
  let findTaskUseCase: FindTaskUseCase;
  let updateTaskUseCase: UpdateTaskUseCase;
  let updateTaskStatusUseCase: UpdateTaskStatusUseCase;
  let deleteTaskUseCase: DeleteTaskUseCase;
  let createAssignmentUseCase: CreateAssignmentUseCase;
  let findAssignmentsUseCase: FindAssignmentsUseCase;
  let removeAssignmentUseCase: RemoveAssignmentUseCase;
  let findChildrenUseCase: FindChildrenUseCase;
  let taskRepo: Mockify<ITaskRepository>;
  let assignmentRepo: Mockify<ITaskAssignmentRepository>;

  beforeAll(async () => {
    taskRepo = createMock<ITaskRepository>([
      'save',
      'findWithPagination',
      'findOneById',
      'update',
      'delete',
      'findChildren',
    ]);
    assignmentRepo = createMock<ITaskAssignmentRepository>([
      'findOneByTaskAndUser',
      'create',
      'findByTaskId',
      'delete',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: TASK_REPOSITORY, useValue: taskRepo },
        { provide: TASK_ASSIGNMENT_REPOSITORY, useValue: assignmentRepo },
        CreateTaskUseCase,
        FindTasksUseCase,
        FindTaskUseCase,
        UpdateTaskUseCase,
        UpdateTaskStatusUseCase,
        DeleteTaskUseCase,
        CreateAssignmentUseCase,
        FindAssignmentsUseCase,
        RemoveAssignmentUseCase,
        FindChildrenUseCase,
      ],
    }).compile();

    createTaskUseCase = module.get(CreateTaskUseCase);
    findTasksUseCase = module.get(FindTasksUseCase);
    findTaskUseCase = module.get(FindTaskUseCase);
    updateTaskUseCase = module.get(UpdateTaskUseCase);
    updateTaskStatusUseCase = module.get(UpdateTaskStatusUseCase);
    deleteTaskUseCase = module.get(DeleteTaskUseCase);
    createAssignmentUseCase = module.get(CreateAssignmentUseCase);
    findAssignmentsUseCase = module.get(FindAssignmentsUseCase);
    removeAssignmentUseCase = module.get(RemoveAssignmentUseCase);
    findChildrenUseCase = module.get(FindChildrenUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createTask', () => {
    it('should create a task with createdById', async () => {
      const dto = { task_name: 'Test task', project_id: 1 };
      const saved = new TaskEntity();
      saved.id_task = 1;
      saved.task_name = 'Test task';
      saved.created_by_id = 42;
      taskRepo.save.mockResolvedValue(saved);

      const result = await createTaskUseCase.execute(dto, 42);

      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ task_name: 'Test task', created_by_id: 42 }),
      );
      expect(result).toEqual(saved);
    });
  });

  describe('findTasks', () => {
    it('should return paginated tasks', async () => {
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [new TaskEntity()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      taskRepo.findWithPagination.mockResolvedValue(expected);

      const result = await findTasksUseCase.execute(query);

      expect(taskRepo.findWithPagination).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findTask', () => {
    it('should return a task when found', async () => {
      const task = new TaskEntity();
      task.id_task = 1;
      taskRepo.findOneById.mockResolvedValue(task);

      const result = await findTaskUseCase.execute(1);

      expect(result).toEqual(task);
    });

    it('should throw NotFoundException when not found', async () => {
      taskRepo.findOneById.mockResolvedValue(null);

      await expect(findTaskUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTask', () => {
    it('should update and return the task', async () => {
      const updated = new TaskEntity();
      updated.id_task = 1;
      updated.task_name = 'Updated';
      taskRepo.update.mockResolvedValue(undefined);
      taskRepo.findOneById.mockResolvedValue(updated);

      const result = await updateTaskUseCase.execute(1, {
        task_name: 'Updated',
      });

      expect(taskRepo.update).toHaveBeenCalledWith(1, { task_name: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update status and return the task', async () => {
      const updated = new TaskEntity();
      updated.id_task = 1;
      updated.status = 2;
      taskRepo.update.mockResolvedValue(undefined);
      taskRepo.findOneById.mockResolvedValue(updated);

      const result = await updateTaskStatusUseCase.execute(1, { status: 2 });

      expect(taskRepo.update).toHaveBeenCalledWith(1, { status: 2 });
      expect(result.status).toBe(2);
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      const task = new TaskEntity();
      task.id_task = 1;
      taskRepo.findOneById.mockResolvedValue(task);

      await deleteTaskUseCase.execute(1);

      expect(taskRepo.delete).toHaveBeenCalledWith(task);
    });

    it('should throw NotFoundException when not found', async () => {
      taskRepo.findOneById.mockResolvedValue(null);

      await expect(deleteTaskUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAssignment', () => {
    it('should create an assignment', async () => {
      assignmentRepo.findOneByTaskAndUser.mockResolvedValue(null);
      const entity = new TaskAssignmentEntity();
      entity.task_id = 1;
      entity.user_id = 2;
      assignmentRepo.create.mockResolvedValue(entity);

      const result = await createAssignmentUseCase.execute({
        task_id: 1,
        user_id: 2,
      });

      expect(assignmentRepo.create).toHaveBeenCalledWith({
        task_id: 1,
        user_id: 2,
      });
      expect(result).toEqual(entity);
    });

    it('should throw ConflictException when already assigned', async () => {
      const existing = new TaskAssignmentEntity();
      assignmentRepo.findOneByTaskAndUser.mockResolvedValue(existing);

      await expect(
        createAssignmentUseCase.execute({ task_id: 1, user_id: 2 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAssignments', () => {
    it('should return assignments for a task', async () => {
      const list = [new TaskAssignmentEntity()];
      assignmentRepo.findByTaskId.mockResolvedValue(list);

      const result = await findAssignmentsUseCase.execute(1);

      expect(result).toEqual(list);
    });
  });

  describe('removeAssignment', () => {
    it('should remove an existing assignment', async () => {
      const entity = new TaskAssignmentEntity();
      assignmentRepo.findOneByTaskAndUser.mockResolvedValue(entity);

      await removeAssignmentUseCase.execute(1, 2);

      expect(assignmentRepo.delete).toHaveBeenCalledWith(entity);
    });

    it('should throw NotFoundException when not found', async () => {
      assignmentRepo.findOneByTaskAndUser.mockResolvedValue(null);

      await expect(removeAssignmentUseCase.execute(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findChildren', () => {
    it('should return child tasks', async () => {
      const children = [new TaskEntity(), new TaskEntity()];
      taskRepo.findChildren.mockResolvedValue(children);

      const result = await findChildrenUseCase.execute(1);

      expect(taskRepo.findChildren).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });
});
