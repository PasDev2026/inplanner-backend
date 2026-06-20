import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as process from 'node:process';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('Autenticación')
@UseGuards(AuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario con username y contraseña, devuelve access token + refresh token',
  })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 14 * 60 * 60 * 1000,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refreshToken, ...userData } = result;
    return userData;
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Renovar access token',
    description:
      'Genera un nuevo access token a partir de un refresh token válido',
  })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, revocado o expirado',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as unknown as { cookies: Record<string, string> })
      .cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const result = await this.authService.refresh({ refreshToken });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return result;
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener perfil',
    description:
      'Devuelve los datos del usuario autenticado mediante el token JWT',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async me(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }

  @Public()
  @Get('csrf-token')
  @ApiOperation({
    summary: 'Obtener token CSRF',
    description:
      'Genera y devuelve un token CSRF firmado para proteger mutaciones',
  })
  @ApiResponse({ status: 200, description: 'Token CSRF generado exitosamente' })
  getCsrfToken() {
    return { csrfToken: this.csrfService.generateToken() };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca el refresh token activo del usuario',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as unknown as { cookies: Record<string, string> })
      .cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return this.authService.logout({ refreshToken });
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Actualizar perfil',
    description: 'Actualiza el nombre y/o email del usuario autenticado',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description:
      'Cambia la contraseña del usuario autenticado validando la contraseña actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.authService.updatePassword(userId, dto);
  }
}
