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
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notas')
@ApiBearerAuth('access-token')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear nota',
    description:
      'Crea una nueva nota en una tarea. El usuario autenticado se asigna como autor automáticamente',
  })
  @ApiResponse({ status: 201, description: 'Nota creada exitosamente' })
  create(@Body() dto: CreateNoteDto, @CurrentUser('sub') userId: number) {
    return this.notesService.create(dto, userId);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar notas',
    description: 'Obtiene todas las notas con paginación y filtros',
  })
  @ApiResponse({ status: 200, description: 'Lista de notas paginada' })
  findAll(@Query() query: QueryNoteDto) {
    return this.notesService.findAll(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener nota por ID',
    description: 'Devuelve una nota específica por su ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la nota' })
  @ApiResponse({ status: 200, description: 'Nota encontrada' })
  @ApiResponse({ status: 404, description: 'Nota no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar nota',
    description: 'Actualiza el contenido de una nota existente',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la nota' })
  @ApiResponse({ status: 200, description: 'Nota actualizada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar nota',
    description: 'Elimina una nota del sistema',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la nota' })
  @ApiResponse({ status: 200, description: 'Nota eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.remove(id);
  }
}
