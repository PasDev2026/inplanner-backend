import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
