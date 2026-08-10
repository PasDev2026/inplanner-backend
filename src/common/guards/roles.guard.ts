import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import type { JwtPayload } from '../../app/auth/interfaces/auth-types';
import { userSedes } from '../helpers/user-auth.helper';

interface RequestWithUser {
  user: JwtPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.sede_activa) return false;

    const userRoleCodes = userSedes(user).map((s) => s.rol_codigo);
    return requiredRoles.some((role) => userRoleCodes.includes(role));
  }
}
