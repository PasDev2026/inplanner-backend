import { InjectionToken } from '@nestjs/common';
import { AreaEntity } from '../entities/area.entity';
import { QueryAreaDto } from '../dtos/query-area.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

export const AREA_REPOSITORY = 'AREA_REPOSITORY' as InjectionToken;

export interface IAreaRepository {
  save(area: AreaEntity): Promise<AreaEntity>;
  findWithPagination(query: QueryAreaDto): Promise<PaginatedResult<AreaEntity>>;
  findOneById(id: number): Promise<AreaEntity | null>;
  findByName(name: string): Promise<AreaEntity | null>;
}
