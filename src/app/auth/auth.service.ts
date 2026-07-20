import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCentralizadoService } from '../../libs/services/auth-centralizado.service';
import { LoginDto } from './dtos/login.dto';
import { UserEntity } from '../users/entities/user.entity';
import type {
  JwtPayload,
  LoginResponse,
  RefreshResponse,
} from './interfaces/auth-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authCentralizado: AuthCentralizadoService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const response = await this.authCentralizado.login(dto);
    const jwt = this.decodeJwt(response.access_token);
    if (jwt) {
      response.usuario.nombres = jwt.nombres;
      response.usuario.apellido_paterno = jwt.apellido_paterno;
      await this.syncLocalUser(jwt, response.usuario.email ?? undefined).catch(
        (err) => this.logger.error('Error syncing local user', err),
      );
    }
    return response;
  }

  async refresh(dto: { refresh_token: string }): Promise<RefreshResponse> {
    const response = await this.authCentralizado.refresh(dto);
    const jwt = this.decodeJwt(response.access_token);
    if (jwt) {
      response.usuario.nombres = jwt.nombres;
      response.usuario.apellido_paterno = jwt.apellido_paterno;
    }
    return response;
  }

  async logout(accessToken: string): Promise<void> {
    return this.authCentralizado.logout(accessToken);
  }

  async changePassword(
    dto: {
      password_actual: string;
      password_nueva: string;
      repetir_password: string;
    },
    accessToken: string,
  ) {
    return this.authCentralizado.changePassword(dto, accessToken);
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(
        Buffer.from(payload, 'base64').toString('utf8'),
      ) as JwtPayload;
    } catch {
      return null;
    }
  }

  private async syncLocalUser(jwt: JwtPayload, email?: string): Promise<void> {
    const sede_id = jwt.roles?.[0]?.sede_id || null;
    const existing = await this.userRepo.findOneBy({
      persona_uuid: jwt.persona_id,
    });
    if (existing) {
      await this.userRepo.update(existing.id_user, {
        numero_documento: jwt.numero_documento,
        name: jwt.nombres,
        apellido_paterno: jwt.apellido_paterno,
        email,
        sede_id,
      });
    } else {
      const user = this.userRepo.create({
        id_user: jwt.sub,
        persona_uuid: jwt.persona_id,
        numero_documento: jwt.numero_documento,
        name: jwt.nombres,
        apellido_paterno: jwt.apellido_paterno,
        email,
        sede_id,
      });
      await this.userRepo.save(user);
    }
  }
}
