import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { IAreaRepository } from '../repository/area-repository.interface';
import { AREA_REPOSITORY } from '../repository/area-repository.interface';
import { AreaEntity } from '../entities/area.entity';
import { UpdateAreaDto } from '../dtos/update-area.dto';

@Injectable()
export class UpdateAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY)
    private readonly areaRepo: IAreaRepository,
  ) {}

  async execute(id: number, dto: UpdateAreaDto): Promise<AreaEntity> {
    const area = await this.areaRepo.findOneById(id);
    if (!area) {
      throw new NotFoundException('Area con ID ' + id + ' no encontrada');
    }
    if (dto.nombre_area && dto.nombre_area !== area.nombre_area) {
      const existing = await this.areaRepo.findByName(dto.nombre_area);
      if (existing) {
        throw new ConflictException(
          'El area "' + dto.nombre_area + '" ya existe',
        );
      }
    }
    Object.assign(area, dto);
    return this.areaRepo.save(area);
  }
}
