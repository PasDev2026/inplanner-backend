import { Controller, Get, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CentralizadoService } from './centralizado.service';
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
}
