import { AreaEntity } from '../../entities/area.entity';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';

export class AreaResponseDto {
  id_area: number;
  nombre_area: string;
  estado: boolean;

  static fromEntity(entity: AreaEntity): AreaResponseDto {
    const dto = new AreaResponseDto();
    dto.id_area = entity.id_area;
    dto.nombre_area = entity.nombre_area;
    dto.estado = entity.estado;
    return dto;
  }

  static fromEntityList(entities: AreaEntity[]): AreaResponseDto[] {
    return entities.map((e) => AreaResponseDto.fromEntity(e));
  }

  static fromPaginated(
    result: PaginatedResult<AreaEntity>,
  ): PaginatedResult<AreaResponseDto> {
    return {
      data: AreaResponseDto.fromEntityList(result.data),
      meta: result.meta,
    };
  }
}
