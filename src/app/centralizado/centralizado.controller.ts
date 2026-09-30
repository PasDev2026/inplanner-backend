import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CentralizadoService } from './centralizado.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { Request } from 'express';

@ApiTags('Centralizado')
@ApiBearerAuth('access-token')
@Controller('centralizado')
export class CentralizadoController {
  constructor(private readonly centralizadoService: CentralizadoService) {}

  @Get()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener roles y sedes',
    description:
      'Devuelve la lista de roles y sedes desde la base centralizada',
  })
  @ApiResponse({ status: 200, description: 'Lista de roles y sedes' })
  findAll(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.centralizadoService.findAll(token);
  }

  @Get('sunat/dni')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Consultar DNI en SUNAT',
    description: 'Devuelve nombres y apellidos para un número de DNI',
  })
  @ApiQuery({ name: 'document', required: true, description: 'Número de DNI' })
  @ApiResponse({ status: 200, description: 'Datos de la persona' })
  @ApiResponse({ status: 404, description: 'No se encontró el DNI en SUNAT' })
  searchDni(@Query('document') document: string) {
    return this.centralizadoService.searchDni(document);
  }

  @Get('tipos-documento')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar tipos de documento',
    description: 'Catálogo de tipos de documento desde centralizado',
  })
  @ApiResponse({ status: 200, description: 'Lista de tipos de documento' })
  getTiposDocumento() {
    return this.centralizadoService.getTiposDocumento();
  }

  @Get('sedes/:sedeUuid/especialidades')
  @Roles(Role.SUPER_ADMINISTRADOR)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listar especialidades de una sede',
    description: 'Especialidades asignadas a la sede en centralizado',
  })
  @ApiResponse({ status: 200, description: 'Lista de especialidades' })
  getEspecialidadesSede(
    @Param('sedeUuid') sedeUuid: string,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.centralizadoService.getEspecialidadesSede(sedeUuid, token);
  }
}
