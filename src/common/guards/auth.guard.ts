import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserEntity } from '../../app/users/entities/user.entity';
import type { JwtPayload } from '../../app/auth/interfaces/auth-types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No se proporcionó un token de acceso');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['RS256'],
      });

      // ponytail: centralizado emite tokens PACIENTE tras el refresh; se
      // aceptan para no romper la sesión del personal, y la sede se rellena
      // desde la DB local abajo (viene vacía en el refresh).
      if (payload.tipo !== 'TRABAJADOR' && payload.tipo !== 'PACIENTE') {
        throw new ForbiddenException(
          'Acceso denegado, solo personal autorizado',
        );
      }

      if (!payload.sede_activa?.rol_codigo) {
        throw new ForbiddenException(
          'No tienes un rol asignado en la sede activa',
        );
      }
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request['user'] = await this.enrichSede(payload);

    return true;
  }

  private async enrichSede(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.sede_activa?.sede_id) return payload;
    const user = await this.userRepo.findOne({
      where: { id_user: payload.sub },
      select: { sede_id: true },
    });
    if (!user?.sede_id) return payload;
    return {
      ...payload,
      sede_activa: { ...payload.sede_activa, sede_id: user.sede_id },
    };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;
    return (request as { cookies?: Record<string, string> }).cookies
      ?.access_token;
  }
}
