import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { UserRoleEntity } from '../users/user-role.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { Role } from '../../common/enums/role.enum';
import {
  JwtPayload,
  LoginResponse,
  UserProfile,
} from './interfaces/auth-types';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  private readonly ROLE_MAP: Record<number, Role> = {
    15: Role.SUPER_ADMIN,
    5: Role.JEFATURA,
    6: Role.PERSONAL,
  };

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { username, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { username },
      relations: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Password incorrecto');
    }

    if (!user.estado) {
      throw new UnauthorizedException('Cuenta suspendida');
    }

    const fullName =
      `${user.name} ${user.apellido_paterno ?? ''} ${user.apellido_materno ?? ''}`.trim();
    const roles = this.resolveRoles(user.userRoles);

    const payload: JwtPayload = {
      sub: user.id_user,
      username: user.username,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id_user);

    return {
      user: {
        idUser: user.id_user,
        username: user.username,
        email: user.email,
        name: user.name,
        apellido_paterno: user.apellido_paterno ?? '',
        fullName,
        roles,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken },
      relations: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (tokenRecord.revoked) {
      throw new UnauthorizedException('Refresh token revocado');
    }
    if (
      tokenRecord.expiration_date &&
      tokenRecord.expiration_date < new Date()
    ) {
      await this.refreshTokenRepository.update(tokenRecord.id, {
        revoked: true,
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!tokenRecord.user.estado) {
      throw new UnauthorizedException(
        'Cuenta suspendida. Contacte al administrador.',
      );
    }

    const userRoles = await this.userRoleRepository.find({
      where: { user_id: tokenRecord.user.id_user },
    });

    const payload: JwtPayload = {
      sub: tokenRecord.user.id_user,
      username: tokenRecord.user.username,
      roles: this.resolveRoles(userRoles),
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    };
  }

  async getProfile(userId: number): Promise<{ user: UserProfile }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
      relations: { userRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (!user.estado) {
      throw new UnauthorizedException('Cuenta suspendida');
    }

    const fullName =
      `${user.name} ${user.apellido_paterno ?? ''} ${user.apellido_materno ?? ''}`.trim();
    const roles = this.resolveRoles(user.userRoles);

    return {
      user: {
        idUser: user.id_user,
        username: user.username,
        email: user.email,
        name: user.name,
        apellido_paterno: user.apellido_paterno ?? '',
        fullName,
        roles,
      },
    };
  }

  async revokeAllTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true },
    );
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.refreshTokenRepository.update(token.id, { revoked: true });

    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 14);

    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true },
    );

    await this.refreshTokenRepository.save({
      token,
      user_id: userId,
      expiration_date: expiresAt,
      revoked: false,
    });

    return token;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    await this.userRepository.save(user);
    return { message: 'Perfil actualizado exitosamente' };
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.current_password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    user.password = await bcrypt.hash(dto.new_password, 10);
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  private resolveRoles(userRoles: UserRoleEntity[]): string[] {
    if (!userRoles || userRoles.length === 0) return [];
    return userRoles
      .map((ur) => this.ROLE_MAP[ur.rol_id])
      .filter((role): role is Role => role !== undefined)
      .map((role) => role as string);
  }
}
