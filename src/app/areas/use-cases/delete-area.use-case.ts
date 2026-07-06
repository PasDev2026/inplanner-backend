import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAreaRepository } from '../repository/area-repository.interface';
import { AREA_REPOSITORY } from '../repository/area-repository.interface';

@Injectable()
export class DeleteAreaUseCase {
  constructor(
    @Inject(AREA_REPOSITORY)
    private readonly areaRepo: IAreaRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const area = await this.areaRepo.findOneById(id);
    if (!area) {
      throw new NotFoundException('Area con ID ' + id + ' no encontrada');
    }
    area.estado = false;
    await this.areaRepo.save(area);
  }
}
