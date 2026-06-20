import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/user.entity';
import { UserRoleEntity } from '../users/user-role.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { Role } from '../../common/enums/role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let userRoleRepository: { find: jest.Mock };
  let refreshTokenRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id_user: 1,
    username: 'testuser',
    password: 'hashed_password',
    email: 'test@example.com',
    name: 'Test',
    apellido_paterno: 'User',
    apellido_materno: null,
    estado: true,
    userRoles: [{ user_id: 1, rol_id: 15 as number }],
  };

  const mockRefreshTokenRecord = {
    id: 1,
    token: 'valid-refresh-token',
    user_id: 1,
    user: { ...mockUser, userRoles: undefined },
    expiration_date: new Date(Date.now() + 3600000),
    revoked: false,
    created_at: new Date(),
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    userRoleRepository = {
      find: jest.fn(),
    };
    refreshTokenRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('fake-access-token'),
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepository },
        {
          provide: getRepositoryToken(UserRoleEntity),
          useValue: userRoleRepository,
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: refreshTokenRepository,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return LoginResponse on valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.user.username).toBe('testuser');
      expect(result.accessToken).toBe('fake-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'unknown', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is suspended', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, estado: false });

      await expect(
        service.login({ username: 'testuser', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return a new access token for a valid refresh token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshTokenRecord);
      userRoleRepository.find.mockResolvedValue(mockUser.userRoles);

      const result = await service.refresh({
        refreshToken: 'valid-refresh-token',
      });

      expect(result.accessToken).toBe('fake-access-token');
    });

    it('should throw UnauthorizedException when refresh token does not exist', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'nonexistent' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token is revoked', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshTokenRecord,
        revoked: true,
      });

      await expect(
        service.refresh({ refreshToken: 'revoked-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException and revoke record when refresh token is expired', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiration_date: new Date(Date.now() - 3600000),
      });

      await expect(
        service.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        mockRefreshTokenRecord.id,
        { revoked: true },
      );
    });

    it('should throw UnauthorizedException when user is suspended', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        ...mockRefreshTokenRecord,
        user: { ...mockUser, estado: false, userRoles: undefined },
      });

      await expect(
        service.refresh({ refreshToken: 'suspended-user-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile for a valid user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result.user.username).toBe('testuser');
      expect(result.user.roles).toContain(Role.SUPER_ADMIN);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is suspended', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, estado: false });

      await expect(service.getProfile(1)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update name and email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.updateProfile(1, {
        name: 'NewName',
        email: 'new@example.com',
      });

      expect(result.message).toBe('Perfil actualizado exitosamente');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { name: 'NewName' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should update password when current password is correct', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.updatePassword(1, {
        current_password: 'current',
        new_password: 'newpassword123',
      });

      expect(result.message).toBe('Contraseña actualizada exitosamente');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword(1, {
          current_password: 'wrong',
          new_password: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePassword(999, {
          current_password: 'current',
          new_password: 'newpassword123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token and return success message', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockRefreshTokenRecord);

      const result = await service.logout({ refreshToken: 'valid-token' });

      expect(result.message).toBe('Sesión cerrada exitosamente');
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        mockRefreshTokenRecord.id,
        { revoked: true },
      );
    });

    it('should throw UnauthorizedException when token does not exist', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.logout({ refreshToken: 'invalid' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeAllTokens', () => {
    it('should revoke all non-revoked tokens for the user', async () => {
      await service.revokeAllTokens(1);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { user_id: 1, revoked: false },
        { revoked: true },
      );
    });
  });
});
