import { Module } from '@nestjs/common';
import { CentralizadoApiService } from '../../libs/services/centralizado-api.service';
import { TrabajadoresCentralizadoService } from '../../libs/services/trabajadores-centralizado.service';
import { CentralizadoController } from './centralizado.controller';
import { CentralizadoService } from './centralizado.service';

@Module({
  controllers: [CentralizadoController],
  providers: [
    CentralizadoApiService,
    TrabajadoresCentralizadoService,
    CentralizadoService,
  ],
  exports: [TrabajadoresCentralizadoService],
})
export class CentralizadoModule {}
