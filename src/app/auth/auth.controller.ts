import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { UserEntity } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { JwtPayload } from './interfaces/auth-types';

@ApiTags('Autenticación')
@UseGuards(AuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario contra centralizado con número de documento y contraseña',
  })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Renovar access token',
  })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh({ refresh_token: refreshToken });
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener perfil',
    description: 'Devuelve los datos del usuario autenticado desde el JWT',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async me(@CurrentUser() user: JwtPayload) {
    const dbUser = await this.userRepo.findOne({
      where: { id_user: user.sub },
      select: { email: true },
    });
    return { ...user, email: dbUser?.email ?? null };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cerrar sesión',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@Req() req: Request) {
    const token = this.extractToken(req);
    return this.authService.logout(token);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description:
      'Cambia la contraseña contra centralizado validando la contraseña actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
  })
  async changePassword(
    @Body()
    dto: {
      password_actual: string;
      password_nueva: string;
      repetir_password: string;
    },
    @Req() req: Request,
  ) {
    const token = this.extractToken(req);
    return this.authService.changePassword(dto, token);
  }

  private extractToken(req: Request): string {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : '';
  }
}
