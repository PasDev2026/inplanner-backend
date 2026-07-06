import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dtos/create-area.dto';
import { UpdateAreaDto } from './dtos/update-area.dto';
import { QueryAreaDto } from './dtos/query-area.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Areas')
@ApiBearerAuth('access-token')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.JEFATURA)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear area',
    description: 'Crea una nueva area (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiResponse({ status: 201, description: 'Area creada exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta accion',
  })
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar areas',
    description: 'Obtiene todas las areas con paginacion y filtros',
  })
  @ApiResponse({ status: 200, description: 'Lista de areas paginada' })
  findAll(@Query() query: QueryAreaDto) {
    return this.areasService.findAll(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener area por ID',
    description: 'Devuelve un area especifica por su ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del area' })
  @ApiResponse({ status: 200, description: 'Area encontrada' })
  @ApiResponse({ status: 404, description: 'Area no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.JEFATURA)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar area',
    description:
      'Actualiza los datos de un area existente (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del area' })
  @ApiResponse({ status: 200, description: 'Area actualizada' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta accion',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar area (soft delete)',
    description:
      'Desactiva un area cambiando su estado a false (requiere SUPER_ADMIN)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del area' })
  @ApiResponse({ status: 200, description: 'Area desactivada' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta accion',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.remove(id);
  }
}
