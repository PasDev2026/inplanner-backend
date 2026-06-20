import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    guard = new RolesGuard(reflector as any);
  });

  function createContext(user?: { roles: string[] }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  it('should return true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate(
      createContext({ roles: [Role.SUPER_ADMIN] }),
    );
    expect(result).toBe(true);
  });

  it('should return true when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);
    const result = guard.canActivate(
      createContext({ roles: [Role.SUPER_ADMIN] }),
    );
    expect(result).toBe(true);
  });

  it('should return false when user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);
    const result = guard.canActivate(createContext({ roles: [Role.PERSONAL] }));
    expect(result).toBe(false);
  });

  it('should return false when user has no roles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);
    const result = guard.canActivate(createContext({ roles: [] }));
    expect(result).toBe(false);
  });

  it('should return false when request has no user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);
    const result = guard.canActivate(createContext(undefined));
    expect(result).toBe(false);
  });
});
