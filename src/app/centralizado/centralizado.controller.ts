import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CentralizadoService } from './centralizado.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Centralizado')
@Controller('centralizado')
export class CentralizadoController {
  constructor(private readonly centralizadoService: CentralizadoService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener roles y sedes',
    description:
      'Devuelve la lista de roles y sedes desde la base centralizada (publico)',
  })
  @ApiResponse({ status: 200, description: 'Lista de roles y sedes' })
  findAll() {
    return this.centralizadoService.findAll();
  }
}
