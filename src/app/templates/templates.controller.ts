import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { ApplyTemplateDto } from './dtos/apply-template.dto';
import { CreateFromTaskDto } from './dtos/create-from-task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/auth-types';
import { isSuperAdmin } from '../../common/helpers/user-auth.helper';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Plantillas')
@ApiBearerAuth('access-token')
@Controller('task-templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  private adminOpts(user: JwtPayload) {
    return { isAdmin: isSuperAdmin(user) };
  }

  @Post()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear plantilla',
    description:
      'Crea una plantilla de tareas y subtareas reutilizable para el usuario autenticado',
  })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  create(@Body() dto: CreateTemplateDto, @CurrentUser('sub') userId: string) {
    return this.templatesService.create(dto, userId);
  }

  @Post('from-task')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Crear plantilla desde tarea existente',
    description:
      'Guarda el árbol de una tarea (con todas sus subtareas) como una nueva plantilla',
  })
  @ApiResponse({ status: 201, description: 'Plantilla creada desde la tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  createFromTask(
    @Body() dto: CreateFromTaskDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.templatesService.createFromTask(dto, userId);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar plantillas',
    description: 'Devuelve las plantillas del usuario autenticado',
  })
  @ApiResponse({ status: 200, description: 'Lista de plantillas' })
  findAll(@CurrentUser('sub') userId: string) {
    return this.templatesService.findAll(userId);
  }

  @Get('all')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar todas las plantillas (superadmin)',
    description:
      'Devuelve todas las plantillas de todos los usuarios con el nombre del propietario',
  })
  @ApiResponse({ status: 200, description: 'Lista completa de plantillas' })
  @ApiResponse({ status: 403, description: 'Requiere rol SUPER_ADMINISTRADOR' })
  findAllForAdmin() {
    return this.templatesService.findAllForAdmin();
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener plantilla',
    description: 'Devuelve la plantilla con su árbol completo de tareas',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.templatesService.findOne(id, user.sub, this.adminOpts(user));
  }

  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Actualizar plantilla',
    description: 'Actualiza el nombre y/o reemplaza el árbol de tareas',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.templatesService.update(
      id,
      dto,
      user.sub,
      this.adminOpts(user),
    );
  }

  @Delete(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Eliminar plantilla',
    description:
      'Oculta la plantilla (soft delete); puede recuperarse desde BD',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.templatesService.remove(id, user.sub, this.adminOpts(user));
  }

  @Post(':id/apply')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Aplicar plantilla',
    description:
      'Crea todas las tareas y subtareas de la plantilla en el proyecto indicado, en una sola transacción',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la plantilla' })
  @ApiResponse({
    status: 201,
    description: 'Tareas creadas desde la plantilla',
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla o tarea padre no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'La tarea padre pertenece a otro proyecto',
  })
  apply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApplyTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.templatesService.apply(id, dto, user.sub, this.adminOpts(user));
  }
}
