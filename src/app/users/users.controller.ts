import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMINISTRADOR)
  @SerializeOptions({ groups: ['user-detail'] })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Crea la persona y el usuario (con contraseña) en centralizado y lo refleja en inplanner (requiere SUPER_ADMIN)',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Documento o email duplicado' })
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.usersService.create(dto, token);
  }

  @Get()
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @SerializeOptions({ groups: ['user-detail'] })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Obtiene todos los usuarios con paginación y filtros (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios paginada' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get('available')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar usuarios disponibles para asignación',
    description:
      'Devuelve lista básica de usuarios (id, nombre) sin paginación',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAvailable() {
    return this.usersService.findAvailable();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMINISTRADOR, Role.JEFATURA)
  @SerializeOptions({ groups: ['user-detail'] })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description:
      'Devuelve un usuario específico por su ID (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Actualiza los datos de un usuario existente (requiere SUPER_ADMIN)',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta acción',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema (requiere SUPER_ADMIN)',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta acción',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
