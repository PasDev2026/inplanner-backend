import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';
import type { UserSede } from '../../app/auth/interfaces/auth-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as never);
  });

  function createContext(user?: {
    sede_activa: UserSede;
    otras_sedes: UserSede[];
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  function sede(rol_codigo: string): UserSede {
    return {
      sede_id: 'sede-1',
      sede_nombre: 'Sede',
      sede_slug: 'sede',
      rol_codigo,
    };
  }

  it('should return true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate(
      createContext({
        sede_activa: sede(Role.SUPER_ADMINISTRADOR),
        otras_sedes: [],
      }),
    );
    expect(result).toBe(true);
  });

  it('should return true when the active sede role matches', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMINISTRADOR]);
    const result = guard.canActivate(
      createContext({
        sede_activa: sede(Role.SUPER_ADMINISTRADOR),
        otras_sedes: [],
      }),
    );
    expect(result).toBe(true);
  });

  it('should return true when a role in otras_sedes matches', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMINISTRADOR]);
    const result = guard.canActivate(
      createContext({
        sede_activa: sede(Role.PERSONAL),
        otras_sedes: [sede(Role.SUPER_ADMINISTRADOR)],
      }),
    );
    expect(result).toBe(true);
  });

  it('should return false when the user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMINISTRADOR]);
    const result = guard.canActivate(
      createContext({
        sede_activa: sede(Role.PERSONAL),
        otras_sedes: [],
      }),
    );
    expect(result).toBe(false);
  });

  it('should return false when request has no user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMINISTRADOR]);
    const result = guard.canActivate(createContext(undefined));
    expect(result).toBe(false);
  });
});
