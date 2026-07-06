import { Injectable, Inject } from '@nestjs/common';
import type { IAreaRepository } from '../repository/area-repository.interface';
import { AREA_REPOSITORY } from '../repository/area-repository.interface';
import { QueryAreaDto } from '../dtos/query-area.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { AreaEntity } from '../entities/area.entity';

@Injectable()
export class FindAreasUseCase {
  constructor(
    @Inject(AREA_REPOSITORY)
    private readonly areaRepo: IAreaRepository,
  ) {}

  async execute(query: QueryAreaDto): Promise<PaginatedResult<AreaEntity>> {
    return this.areaRepo.findWithPagination(query);
  }
}
