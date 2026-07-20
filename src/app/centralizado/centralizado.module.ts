import { Module } from '@nestjs/common';
import { CentralizadoApiService } from '../../libs/services/centralizado-api.service';
import { CentralizadoController } from './centralizado.controller';
import { CentralizadoService } from './centralizado.service';

@Module({
  controllers: [CentralizadoController],
  providers: [CentralizadoApiService, CentralizadoService],
})
export class CentralizadoModule {}
