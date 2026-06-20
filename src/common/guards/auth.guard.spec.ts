import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  function createContext(
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {},
  ): ExecutionContext {
    const request = { headers, cookies };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  describe('canActivate', () => {
    it('should return true for @Public() endpoints', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = createContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        'No se proporcionó un token de acceso',
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      const context = createContext({ authorization: 'Bearer invalid-token' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token inválido o expirado',
      );
    });

    it('should return true and set user on request when token is valid', async () => {
      const payload = { sub: 1, username: 'testuser', roles: [] };
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(payload);
      const request: Record<string, unknown> = {
        headers: { authorization: 'Bearer valid-token' },
        cookies: {},
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(payload);
    });

    it('should extract token from cookie when Bearer header is absent', async () => {
      const payload = { sub: 1, username: 'testuser', roles: [] };
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockResolvedValue(payload);
      const request = {
        headers: {},
        cookies: { access_token: 'cookie-token' },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-token', {
        secret: process.env.JWT_SECRET,
      });
    });
  });
});
