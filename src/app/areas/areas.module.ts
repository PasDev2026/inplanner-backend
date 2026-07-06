import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from './entities/area.entity';
import { AREA_REPOSITORY } from './repository/area-repository.interface';
import { AreaTypeormRepository } from './persistence/area.typeorm.repository';
import { CreateAreaUseCase } from './use-cases/create-area.use-case';
import { FindAreasUseCase } from './use-cases/find-areas.use-case';
import { FindAreaUseCase } from './use-cases/find-area.use-case';
import { UpdateAreaUseCase } from './use-cases/update-area.use-case';
import { DeleteAreaUseCase } from './use-cases/delete-area.use-case';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity])],
  controllers: [AreasController],
  providers: [
    { provide: AREA_REPOSITORY, useClass: AreaTypeormRepository },
    CreateAreaUseCase,
    FindAreasUseCase,
    FindAreaUseCase,
    UpdateAreaUseCase,
    DeleteAreaUseCase,
    AreasService,
  ],
  exports: [TypeOrmModule],
})
export class AreasModule {}
