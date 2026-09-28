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
  ParseUUIDPipe,
  BadRequestException,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'node:path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { QueryTaskDto } from './dtos/query-task.dto';
import { CreateTaskAssignmentDto } from './dtos/create-task-assignment.dto';
import { UpdateTaskStatusDto } from './dtos/update-task-status.dto';
import { ReorderTaskDto } from './dtos/reorder-tasks.dto';
import { ImportTasksDto } from './dtos/import-tasks.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { IMPORT_TEMPLATE_MAX_BYTES } from './lib/import-template';

const IMPORT_ALLOWED_EXTENSIONS = ['.xlsx', '.csv'];
const IMPORT_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function importFileInterceptor() {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: IMPORT_TEMPLATE_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      const extension = extname(file.originalname).toLowerCase();
      if (!IMPORT_ALLOWED_EXTENSIONS.includes(extension)) {
        cb(
          new BadRequestException('Solo se permiten archivos .xlsx o .csv'),
          false,
        );
        return;
      }
      cb(null, true);
    },
  });
}

@ApiTags('Tareas')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear tarea',
    description:
      'Crea una nueva tarea. El usuario autenticado se asigna como creador autom\u00e1ticamente',
  })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('sub') userId: string) {
    return this.tasksService.create(dto, userId);
  }

  @Post('import')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Importar actividades',
    description:
      'Crea tareas y subtareas desde un archivo Excel (.xlsx) o CSV. ' +
      'Columnas: Tarea, Descripcion, Nivel, Estado. Devuelve las tareas creadas.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        project_id: { type: 'integer', description: 'ID del proyecto' },
        parent_task_id: {
          type: 'integer',
          nullable: true,
          description: 'ID de la tarea padre (opcional)',
        },
        file: { type: 'string', format: 'binary' },
      },
      required: ['project_id', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tareas creadas desde el archivo' })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o sin actividades',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o tarea padre no encontrada',
  })
  @UseInterceptors(importFileInterceptor())
  import(
    @Body() dto: ImportTasksDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.tasksService.import(dto, file, userId);
  }

  @Post('import/preview')
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @ApiOperation({
    summary: 'Previsualizar importación',
    description:
      'Analiza el archivo y devuelve las filas válidas, las ignoradas y los errores con su fila exacta, sin crear tareas',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        project_id: { type: 'integer', description: 'ID del proyecto' },
        parent_task_id: {
          type: 'integer',
          nullable: true,
          description: 'ID de la tarea padre (opcional)',
        },
        file: { type: 'string', format: 'binary' },
      },
      required: ['project_id', 'file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado del análisis del archivo',
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @UseInterceptors(importFileInterceptor())
  previewImport(
    @Body() dto: ImportTasksDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.tasksService.preview(dto, file);
  }

  @Get('import/template')
  @SkipTransform()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Descargar plantilla de importación',
    description: 'Descarga el archivo Excel de ejemplo con el formato válido',
  })
  async downloadImportTemplate(): Promise<StreamableFile> {
    const buffer = await this.tasksService.getImportTemplate();
    return new StreamableFile(buffer, {
      type: IMPORT_MIME_TYPE,
      disposition: 'attachment; filename="Plantilla_Importar_Actividades.xlsx"',
    });
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar tareas',
    description: 'Obtiene todas las tareas con paginaci\u00f3n y filtros',
  })
  @ApiResponse({ status: 200, description: 'Lista de tareas paginada' })
  findAll(@Query() query: QueryTaskDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener tarea por ID',
    description: 'Devuelve una tarea espec\u00edfica por su ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch('reorder')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reordenar tarea',
    description: 'Reordena una tarea dentro de su columna',
  })
  @ApiResponse({ status: 200, description: 'Tarea reordenada' })
  reorder(@Body() dto: ReorderTaskDto) {
    return this.tasksService.reorder(dto);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar tarea',
    description: 'Actualiza los datos de una tarea existente',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar tarea',
    description: 'Elimina una tarea del sistema',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }

  @Post(':taskId/assignments')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Asignar usuario a tarea',
    description: 'Asigna un usuario a una tarea',
  })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 201, description: 'Usuario asignado' })
  createAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTaskAssignmentDto,
  ) {
    return this.tasksService.createAssignment({ ...dto, task_id: taskId });
  }

  @Get(':taskId/assignments')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar asignaciones',
    description: 'Obtiene los usuarios asignados a una tarea',
  })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones' })
  findAssignments(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.tasksService.findAssignments(taskId);
  }

  @Delete(':taskId/assignments/:userId')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Quitar asignacion',
    description: 'Elimina la asignacion de un usuario a una tarea',
  })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID del usuario asignado',
  })
  @ApiResponse({ status: 200, description: 'Asignacion eliminada' })
  removeAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.tasksService.removeAssignment(taskId, userId);
  }

  @Get(':id/children')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener subtareas',
    description: 'Devuelve las subtareas directas de una tarea',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea padre' })
  @ApiResponse({ status: 200, description: 'Lista de subtareas' })
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findChildren(id);
  }

  @Patch(':id/status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar estado',
    description:
      'Actualiza el estado de una tarea (0=Pendiente, 1=En espera, 2=En progreso, 3=En revision, 4=Completado)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(id, dto);
  }
}
