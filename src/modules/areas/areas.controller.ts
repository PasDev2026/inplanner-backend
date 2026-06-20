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
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { QueryAreaDto } from './dto/query-area.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Áreas')
@ApiBearerAuth('access-token')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.JEFATURA)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear área',
    description: 'Crea una nueva área (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiResponse({ status: 201, description: 'Área creada exitosamente' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta acción',
  })
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar áreas',
    description: 'Obtiene todas las áreas con paginación y filtros',
  })
  @ApiResponse({ status: 200, description: 'Lista de áreas paginada' })
  findAll(@Query() query: QueryAreaDto) {
    return this.areasService.findAll(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener área por ID',
    description: 'Devuelve un área específica por su ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
  @ApiResponse({ status: 200, description: 'Área encontrada' })
  @ApiResponse({ status: 404, description: 'Área no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.JEFATURA)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar área',
    description:
      'Actualiza los datos de un área existente (requiere SUPER_ADMIN o JEFATURA)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
  @ApiResponse({ status: 200, description: 'Área actualizada' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta acción',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar área (soft delete)',
    description:
      'Desactiva un área cambiando su estado a false (requiere SUPER_ADMIN)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del área' })
  @ApiResponse({ status: 200, description: 'Área desactivada' })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para esta acción',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.areasService.remove(id);
  }
}
