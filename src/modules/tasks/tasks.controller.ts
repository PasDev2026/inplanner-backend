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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tareas')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tarea', description: 'Crea una nueva tarea. El usuario autenticado se asigna como creador automáticamente' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente' })
  create(@Body() dto: CreateTaskDto, @CurrentUser('sub') userId: number) {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas', description: 'Obtiene todas las tareas con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de tareas paginada' })
  findAll(@Query() query: QueryTaskDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tarea por ID', description: 'Devuelve una tarea específica por su ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tarea', description: 'Actualiza los datos de una tarea existente' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tarea', description: 'Elimina una tarea del sistema' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }

  @Post(':taskId/assignments')
  @ApiOperation({ summary: 'Asignar usuario a tarea', description: 'Asigna un usuario a una tarea' })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 201, description: 'Usuario asignado' })
  createAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateTaskAssignmentDto,
  ) {
    return this.tasksService.createAssignment({ ...dto, task_id: taskId });
  }

  @Get(':taskId/assignments')
  @ApiOperation({ summary: 'Listar asignaciones', description: 'Obtiene los usuarios asignados a una tarea' })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones' })
  findAssignments(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.tasksService.findAssignments(taskId);
  }

  @Delete(':taskId/assignments/:userId')
  @ApiOperation({ summary: 'Quitar asignación', description: 'Elimina la asignación de un usuario a una tarea' })
  @ApiParam({ name: 'taskId', type: Number, description: 'ID de la tarea' })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del usuario asignado' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada' })
  removeAssignment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tasksService.removeAssignment(taskId, userId);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Obtener subtareas', description: 'Devuelve las subtareas directas de una tarea' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea padre' })
  @ApiResponse({ status: 200, description: 'Lista de subtareas' })
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findChildren(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado', description: 'Actualiza el estado de una tarea (0=Pendiente, 1=En espera, 2=En progreso, 3=En revisi\u00f3n, 4=Completado)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(id, dto);
  }
}
