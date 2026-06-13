import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CentralizadoService } from './centralizado.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Centralizado')
@Controller('centralizado')
export class CentralizadoController {
  constructor(private readonly centralizadoService: CentralizadoService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener roles y sedes', description: 'Devuelve la lista de roles y sedes desde la base centralizada (público)' })
  @ApiResponse({ status: 200, description: 'Lista de roles y sedes' })
  findAll() {
    return this.centralizadoService.findAll();
  }
}
