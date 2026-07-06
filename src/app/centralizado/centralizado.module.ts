import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from './entities/rol.entity';
import { SedeEntity } from './entities/sede.entity';
import { CENTRALIZADO_REPOSITORY } from './repository/centralizado-repository.interface';
import { CentralizadoTypeormRepository } from './persistence/centralizado.typeorm.repository';
import { CentralizadoController } from './centralizado.controller';
import { CentralizadoService } from './centralizado.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity, SedeEntity])],
  controllers: [CentralizadoController],
  providers: [
    {
      provide: CENTRALIZADO_REPOSITORY,
      useClass: CentralizadoTypeormRepository,
    },
    CentralizadoService,
  ],
  exports: [TypeOrmModule],
})
export class CentralizadoModule {}
