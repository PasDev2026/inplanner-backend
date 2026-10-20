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
  StreamableFile,
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
import { TasksService } from '../tasks/tasks.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { QueryProjectDto } from './dtos/query-project.dto';
import { CreateProjectResponsibleDto } from './dtos/create-project-responsible.dto';
import { ReorderProjectDto } from './dtos/reorder-projects.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import type { JwtPayload } from '../auth/interfaces/auth-types';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('Proyectos')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

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
    description: 'Obtiene todos los proyectos sin paginacion para ver el kaban',
  })
  @ApiResponse({ status: 200, description: 'Lista de proyectos para Kanban' })
  findKanban(@Query() query: QueryProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findKanban(query, user);
  }

  @Get(':id/tasks/export')
  @SkipTransform()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Exportar tareas del proyecto',
    description:
      'Descarga un Excel con todas las tareas del proyecto en el formato de la plantilla de importación, incluyendo la columna ID para poder reimportarlo sin duplicar.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del proyecto' })
  @ApiResponse({ status: 200, description: 'Archivo Excel' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'El usuario no es manager del proyecto ni superadmin',
  })
  async exportTasks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.tasksService.exportProject(
      id,
      user,
    );
    return new StreamableFile(buffer, {
      type: EXCEL_MIME_TYPE,
      disposition: `attachment; filename="${filename}"`,
    });
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
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeResponsible(projectId, userId);
  }
}
