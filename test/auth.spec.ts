import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserEntity } from '../src/app/users/entities/user.entity';
import { UserRoleEntity } from '../src/app/users/entities/user-role.entity';
import { REFRESH_TOKEN_REPOSITORY } from '../src/app/auth/repository/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../src/app/auth/repository/refresh-token-repository.interface';
import { LoginUseCase } from '../src/app/auth/use-cases/login.use-case';
import { RefreshUseCase } from '../src/app/auth/use-cases/refresh.use-case';
import { LogoutUseCase } from '../src/app/auth/use-cases/logout.use-case';
import { GetProfileUseCase } from '../src/app/auth/use-cases/get-profile.use-case';
import { UpdatePasswordUseCase } from '../src/app/auth/use-cases/update-password.use-case';
import { CheckPasswordUseCase } from '../src/app/auth/use-cases/check-password.use-case';
import { UpdateProfileUseCase } from '../src/app/auth/use-cases/update-profile.use-case';
import { RevokeTokensUseCase } from '../src/app/auth/use-cases/revoke-tokens.use-case';
import { RefreshTokenEntity } from '../src/app/auth/entities/refresh-token.entity';
import { createMock, Mockify } from './helpers/mock-factory';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthModule', () => {
  let loginUseCase: LoginUseCase;
  let refreshUseCase: RefreshUseCase;
  let logoutUseCase: LogoutUseCase;
  let getProfileUseCase: GetProfileUseCase;
  let updatePasswordUseCase: UpdatePasswordUseCase;
  let checkPasswordUseCase: CheckPasswordUseCase;
  let updateProfileUseCase: UpdateProfileUseCase;
  let revokeTokensUseCase: RevokeTokensUseCase;
  let userRepo: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock };
  let userRoleRepo: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock };
  let refreshTokenRepo: Mockify<IRefreshTokenRepository>;
  let jwtService: Mockify<JwtService>;

  beforeAll(async () => {
    userRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
    userRoleRepo = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
    refreshTokenRepo = createMock<IRefreshTokenRepository>([
      'findByToken',
      'findWithUser',
      'save',
      'revokeById',
      'revokeAllForUser',
    ]);
    jwtService = createMock<JwtService>(['sign']);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        { provide: getRepositoryToken(UserRoleEntity), useValue: userRoleRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: JwtService, useValue: jwtService },
        LoginUseCase,
        RefreshUseCase,
        LogoutUseCase,
        GetProfileUseCase,
        UpdatePasswordUseCase,
        CheckPasswordUseCase,
        UpdateProfileUseCase,
        RevokeTokensUseCase,
      ],
    }).compile();

    loginUseCase = module.get(LoginUseCase);
    refreshUseCase = module.get(RefreshUseCase);
    logoutUseCase = module.get(LogoutUseCase);
    getProfileUseCase = module.get(GetProfileUseCase);
    updatePasswordUseCase = module.get(UpdatePasswordUseCase);
    checkPasswordUseCase = module.get(CheckPasswordUseCase);
    updateProfileUseCase = module.get(UpdateProfileUseCase);
    revokeTokensUseCase = module.get(RevokeTokensUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user data on valid credentials', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        username: 'jdoe',
        email: 'j@doe.com',
        name: 'John',
        apellido_paterno: 'Doe',
        estado: true,
        password: 'hashed',
        userRoles: [{ role_id: 1, role: { name: 'ADMIN' } }],
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token123');
      refreshTokenRepo.save.mockResolvedValue(new RefreshTokenEntity());

      const result = await loginUseCase.execute({
        username: 'jdoe',
        password: 'pass',
      });

      expect(result.accessToken).toBe('token123');
      expect(result.user.username).toBe('jdoe');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        loginUseCase.execute({ username: 'nobody', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const user = Object.assign(new UserEntity(), {
        username: 'jdoe',
        password: 'hashed',
        estado: true,
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        loginUseCase.execute({ username: 'jdoe', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is suspended', async () => {
      const user = Object.assign(new UserEntity(), {
        username: 'jdoe',
        password: 'hashed',
        estado: false,
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        loginUseCase.execute({ username: 'jdoe', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new access token for valid refresh token', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        username: 'jdoe',
        estado: true,
      });
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const tokenRecord = Object.assign(new RefreshTokenEntity(), {
        id: 1,
        token: 'valid-refresh',
        revoked: false,
        expiration_date: future,
        user,
      });
      refreshTokenRepo.findWithUser.mockResolvedValue(tokenRecord);
      userRoleRepo.find.mockResolvedValue([]);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await refreshUseCase.execute({
        refreshToken: 'valid-refresh',
      });

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when token not found', async () => {
      refreshTokenRepo.findWithUser.mockResolvedValue(null);

      await expect(
        refreshUseCase.execute({ refreshToken: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token revoked', async () => {
      const tokenRecord = Object.assign(new RefreshTokenEntity(), {
        revoked: true,
        user: new UserEntity(),
      });
      refreshTokenRepo.findWithUser.mockResolvedValue(tokenRecord);

      await expect(
        refreshUseCase.execute({ refreshToken: 'revoked' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token expired', async () => {
      const past = new Date('2020-01-01');
      const tokenRecord = Object.assign(new RefreshTokenEntity(), {
        id: 1,
        revoked: false,
        expiration_date: past,
        user: Object.assign(new UserEntity(), { estado: true }),
      });
      refreshTokenRepo.findWithUser.mockResolvedValue(tokenRecord);

      await expect(
        refreshUseCase.execute({ refreshToken: 'expired' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith(1);
    });
  });

  describe('logout', () => {
    it('should revoke token and return success message', async () => {
      const tokenRecord = new RefreshTokenEntity();
      tokenRecord.id = 1;
      refreshTokenRepo.findByToken.mockResolvedValue(tokenRecord);

      const result = await logoutUseCase.execute({
        refreshToken: 'some-token',
      });

      expect(refreshTokenRepo.revokeById).toHaveBeenCalledWith(1);
      expect(result.message).toContain('exitosa');
    });

    it('should throw UnauthorizedException when token not found', async () => {
      refreshTokenRepo.findByToken.mockResolvedValue(null);

      await expect(
        logoutUseCase.execute({ refreshToken: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        username: 'jdoe',
        email: 'j@doe.com',
        name: 'John',
        apellido_paterno: 'Doe',
        estado: true,
        userRoles: [],
      });
      userRepo.findOne.mockResolvedValue(user);

      const result = await getProfileUseCase.execute(1);

      expect(result.user.username).toBe('jdoe');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(getProfileUseCase.execute(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password on valid current password', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        password: 'old-hashed',
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      const result = await updatePasswordUseCase.execute(1, {
        current_password: 'old',
        new_password: 'new',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('old', 'old-hashed');
      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new-hashed' }),
      );
      expect(result.message).toContain('actualizada');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        updatePasswordUseCase.execute(999, {
          current_password: 'old',
          new_password: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException on wrong current password', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        password: 'hashed',
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        updatePasswordUseCase.execute(1, {
          current_password: 'wrong',
          new_password: 'new',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('checkPassword', () => {
    it('should return success on correct password', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        password: 'hashed',
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await checkPasswordUseCase.execute(1, {
        password: 'correct',
      });

      expect(result.message).toContain('correcta');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        password: 'hashed',
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        checkPasswordUseCase.execute(1, { password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update name and email', async () => {
      const user = Object.assign(new UserEntity(), {
        id_user: 1,
        name: 'Old',
        email: 'old@mail.com',
      });
      userRepo.findOne.mockResolvedValue(user);

      const result = await updateProfileUseCase.execute(1, {
        name: 'New',
        email: 'new@mail.com',
      });

      expect(user.name).toBe('New');
      expect(user.email).toBe('new@mail.com');
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(result.message).toContain('actualizado');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        updateProfileUseCase.execute(999, { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeTokens', () => {
    it('should revoke all tokens for user', async () => {
      await revokeTokensUseCase.execute(1);

      expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(1);
    });
  });
});
