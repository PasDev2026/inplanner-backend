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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectDto } from './dtos/query-project.dto';
import { CreateProjectResponsibleDto } from './dtos/create-project-responsible.dto';
import { ReorderProjectDto } from './dtos/reorder-projects.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/auth-types';

@ApiTags('Proyectos')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear proyecto',
    description: 'Crea un nuevo proyecto',
  })
  @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar proyectos',
    description: 'Obtiene todos los proyectos con paginacion y filtros',
  })
  @ApiResponse({ status: 200, description: 'Lista de proyectos paginada' })
  findAll(@Query() query: QueryProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(query, user);
  }

  @Get('kanban')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar proyectos para Kanban',
    description: 'Obtiene todos los proyectos sin paginación para la vista Kanban',
  })
  @ApiResponse({ status: 200, description: 'Lista de proyectos para Kanban' })
  findKanban(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findKanban(user);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener proyecto por ID',
    description: 'Devuelve un proyecto especifico por su ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findOne(id, user);
  }

  @Patch('reorder_project')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reordenar proyecto',
    description: 'Reordena un proyecto dentro de su columna en el Kanban',
  })
  @ApiResponse({ status: 200, description: 'Proyecto reordenado' })
  reorder(@Body() dto: ReorderProjectDto) {
    return this.projectsService.reorder(dto);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar proyecto',
    description: 'Actualiza los datos de un proyecto existente',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto actualizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar proyecto',
    description: 'Elimina un proyecto del sistema',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Proyecto eliminado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }

  @Post(':projectId/responsibles')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Asignar responsable',
    description: 'Asigna un usuario como responsable del proyecto',
  })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 201, description: 'Responsable asignado' })
  createResponsible(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectResponsibleDto,
  ) {
    return this.projectsService.createResponsible({
      ...dto,
      project_id: projectId,
    });
  }

  @Get(':projectId/responsibles')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar responsables',
    description: 'Obtiene los responsables de un proyecto',
  })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Lista de responsables' })
  findResponsibles(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectsService.findResponsibles(projectId);
  }

  @Delete(':projectId/responsibles/:userId')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Quitar responsable',
    description: 'Elimina un responsable del proyecto',
  })
  @ApiParam({ name: 'projectId', type: Number, description: 'ID del proyecto' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID del usuario responsable',
  })
  @ApiResponse({ status: 200, description: 'Responsable eliminado' })
  removeResponsible(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectsService.removeResponsible(projectId, userId);
  }
}
