import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IAreaRepository } from '../repository/area-repository.interface';
import { AREA_REPOSITORY } from '../repository/area-repository.interface';
import { AreaEntity } from '../entities/area.entity';
import { CreateAreaDto } from '../dtos/create-area.dto';

@Injectable()
export class CreateAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY)
    private readonly areaRepo: IAreaRepository,
  ) {}

  async execute(dto: CreateAreaDto): Promise<AreaEntity> {
    const existing = await this.areaRepo.findByName(dto.nombre_area);
    if (existing) {
      throw new ConflictException(
        'El area "' + dto.nombre_area + '" ya existe',
      );
    }
    const area = new AreaEntity();
    Object.assign(area, dto);
    return this.areaRepo.save(area);
  }
}
