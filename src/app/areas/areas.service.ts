import { Injectable } from '@nestjs/common';
import { CreateAreaUseCase } from './use-cases/create-area.use-case';
import { FindAreasUseCase } from './use-cases/find-areas.use-case';
import { FindAreaUseCase } from './use-cases/find-area.use-case';
import { UpdateAreaUseCase } from './use-cases/update-area.use-case';
import { DeleteAreaUseCase } from './use-cases/delete-area.use-case';
import { CreateAreaDto } from './dtos/create-area.dto';
import { UpdateAreaDto } from './dtos/update-area.dto';
import { QueryAreaDto } from './dtos/query-area.dto';
import { AreaResponseDto } from './dtos/response/area-response.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class AreasService {
  constructor(
    private readonly createAreaUseCase: CreateAreaUseCase,
    private readonly findAreasUseCase: FindAreasUseCase,
    private readonly findAreaUseCase: FindAreaUseCase,
    private readonly updateAreaUseCase: UpdateAreaUseCase,
    private readonly deleteAreaUseCase: DeleteAreaUseCase,
  ) {}

  async create(dto: CreateAreaDto): Promise<AreaResponseDto> {
    const area = await this.createAreaUseCase.execute(dto);
    return AreaResponseDto.fromEntity(area);
  }

  async findAll(
    query: QueryAreaDto,
  ): Promise<PaginatedResult<AreaResponseDto>> {
    const result = await this.findAreasUseCase.execute(query);
    return AreaResponseDto.fromPaginated(result);
  }

  async findOne(id: number): Promise<AreaResponseDto> {
    const area = await this.findAreaUseCase.execute(id);
    return AreaResponseDto.fromEntity(area);
  }

  async update(id: number, dto: UpdateAreaDto): Promise<AreaResponseDto> {
    const area = await this.updateAreaUseCase.execute(id, dto);
    return AreaResponseDto.fromEntity(area);
  }

  async remove(id: number): Promise<void> {
    await this.deleteAreaUseCase.execute(id);
  }
}
