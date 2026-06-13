import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from './entities/rol.entity';
import { SedeEntity } from './entities/sede.entity';
import { CentralizadoController } from './centralizado.controller';
import { CentralizadoService } from './centralizado.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity, SedeEntity])],
  controllers: [CentralizadoController],
  providers: [CentralizadoService],
  exports: [TypeOrmModule],
})
export class CentralizadoModule {}
