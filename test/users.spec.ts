import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { USERS_REPOSITORY } from '../src/app/users/repository/user-repository.interface';
import type { IUsersRepository } from '../src/app/users/repository/user-repository.interface';
import { CreateUserUseCase } from '../src/app/users/use-cases/create-user.use-case';
import { FindUsersUseCase } from '../src/app/users/use-cases/find-users.use-case';
import { FindUserUseCase } from '../src/app/users/use-cases/find-user.use-case';
import { UpdateUserUseCase } from '../src/app/users/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../src/app/users/use-cases/delete-user.use-case';
import { SocketService } from '../src/modules/socket/socket.service';
import { UserEntity } from '../src/app/users/entities/user.entity';
import { createMock, Mockify } from './helpers/mock-factory';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersModule', () => {
  let createUserUseCase: CreateUserUseCase;
  let findUsersUseCase: FindUsersUseCase;
  let findUserUseCase: FindUserUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  let deleteUserUseCase: DeleteUserUseCase;
  let userRepo: Mockify<IUsersRepository>;
  let socketService: Mockify<SocketService>;

  beforeAll(async () => {
    userRepo = createMock<IUsersRepository>([
      'save',
      'findWithPagination',
      'findByIdWithRelations',
      'softDelete',
      'findByCredentials',
      'replaceSedes',
      'replaceRoles',
    ]);
    socketService = createMock<SocketService>(['forceLogout']);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: USERS_REPOSITORY, useValue: userRepo },
        { provide: SocketService, useValue: socketService },
        CreateUserUseCase,
        FindUsersUseCase,
        FindUserUseCase,
        UpdateUserUseCase,
        DeleteUserUseCase,
      ],
    }).compile();

    createUserUseCase = module.get(CreateUserUseCase);
    findUsersUseCase = module.get(FindUsersUseCase);
    findUserUseCase = module.get(FindUserUseCase);
    updateUserUseCase = module.get(UpdateUserUseCase);
    deleteUserUseCase = module.get(DeleteUserUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  describe('createUser', () => {
    it('should create a user with hashed password and relations', async () => {
      userRepo.findByCredentials.mockResolvedValue(null);
      const saved = new UserEntity();
      saved.id_user = 1;
      saved.username = 'jdoe';
      userRepo.save.mockResolvedValue(saved);
      const withRelations = new UserEntity();
      withRelations.id_user = 1;
      withRelations.username = 'jdoe';
      userRepo.findByIdWithRelations.mockResolvedValue(withRelations);

      const result = await createUserUseCase.execute({
        username: 'jdoe',
        email: 'j@doe.com',
        dni: '12345678',
        password: 'plain',
        name: 'John',
        area_id: 1,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
      expect(result).toEqual(withRelations);
    });

    it('should throw ConflictException on duplicate username', async () => {
      const existing = new UserEntity();
      existing.username = 'jdoe';
      existing.email = 'other@mail.com';
      existing.dni = '99999999';
      userRepo.findByCredentials.mockResolvedValue(existing);

      await expect(
        createUserUseCase.execute({
          username: 'jdoe',
          email: 'j@doe.com',
          dni: '12345678',
          password: 'plain',
          name: 'John',
          area_id: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate email', async () => {
      const existing = new UserEntity();
      existing.username = 'other';
      existing.email = 'j@doe.com';
      existing.dni = '99999999';
      userRepo.findByCredentials.mockResolvedValue(existing);

      await expect(
        createUserUseCase.execute({
          username: 'jdoe',
          email: 'j@doe.com',
          dni: '12345678',
          password: 'plain',
          name: 'John',
          area_id: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate DNI', async () => {
      const existing = new UserEntity();
      existing.username = 'other';
      existing.email = 'other@mail.com';
      existing.dni = '12345678';
      userRepo.findByCredentials.mockResolvedValue(existing);

      await expect(
        createUserUseCase.execute({
          username: 'jdoe',
          email: 'j@doe.com',
          dni: '12345678',
          password: 'plain',
          name: 'John',
          area_id: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should replace sedes and roles when provided', async () => {
      userRepo.findByCredentials.mockResolvedValue(null);
      const saved = new UserEntity();
      saved.id_user = 1;
      userRepo.save.mockResolvedValue(saved);
      const withRelations = new UserEntity();
      withRelations.id_user = 1;
      userRepo.findByIdWithRelations.mockResolvedValue(withRelations);

      await createUserUseCase.execute({
        username: 'jdoe',
        email: 'j@doe.com',
        dni: '12345678',
        password: 'plain',
        name: 'John',
        area_id: 5,
        sede_ids: [1, 2],
        rol_ids: [3],
      });

      expect(userRepo.replaceSedes).toHaveBeenCalledWith(1, [1, 2]);
      expect(userRepo.replaceRoles).toHaveBeenCalledWith(1, [3]);
    });
  });

  describe('findUsers', () => {
    it('should return paginated users', async () => {
      const expected = {
        data: [new UserEntity()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      userRepo.findWithPagination.mockResolvedValue(expected);

      const result = await findUsersUseCase.execute({ page: 1, limit: 20 });

      expect(result).toEqual(expected);
    });
  });

  describe('findUser', () => {
    it('should return user when found', async () => {
      const user = new UserEntity();
      user.id_user = 1;
      userRepo.findByIdWithRelations.mockResolvedValue(user);

      const result = await findUserUseCase.execute(1);

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when not found', async () => {
      userRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(findUserUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        estado: true,
        name: 'Old',
      });
      userRepo.findByIdWithRelations.mockResolvedValue(user);
      userRepo.findByCredentials.mockResolvedValue(null);

      const result = await updateUserUseCase.execute(1, {
        name: 'John',
      });

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('John');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        updateUserUseCase.execute(999, { name: 'John' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate username', async () => {
      const user = new UserEntity();
      user.id_user = 1;
      user.username = 'jdoe';
      userRepo.findByIdWithRelations.mockResolvedValue(user);
      const other = new UserEntity();
      other.id_user = 2;
      other.username = 'newuser';
      userRepo.findByCredentials.mockResolvedValue(other);

      await expect(
        updateUserUseCase.execute(1, { username: 'newuser' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password when updating it', async () => {
      const user = new UserEntity();
      user.id_user = 1;
      user.estado = true;
      userRepo.findByIdWithRelations.mockResolvedValue(user);
      userRepo.findByCredentials.mockResolvedValue(null);

      await updateUserUseCase.execute(1, { password: 'newplain' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newplain', 10);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
    });

    it('should call forceLogout when deactivating user', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        estado: true,
      });
      userRepo.findByIdWithRelations.mockResolvedValue(user);
      userRepo.findByCredentials.mockResolvedValue(null);

      await updateUserUseCase.execute(1, { estado: false });

      expect(socketService.forceLogout).toHaveBeenCalledWith(
        1,
        expect.stringContaining('desactivada'),
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete and force logout', async () => {
      const user = new UserEntity();
      user.id_user = 1;
      userRepo.findByIdWithRelations.mockResolvedValue(user);

      await deleteUserUseCase.execute(1);

      expect(userRepo.softDelete).toHaveBeenCalledWith(1);
      expect(socketService.forceLogout).toHaveBeenCalledWith(
        1,
        expect.stringContaining('desactivada'),
      );
    });

    it('should throw NotFoundException when not found', async () => {
      userRepo.findByIdWithRelations.mockResolvedValue(null);

      await expect(deleteUserUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
