import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class QueryTaskDto {
  @ApiProperty({ example: 1, description: 'Número de página', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.PAGE_NUMBER_MIN)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Cantidad de registros por página (máx. 100)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.LIMIT_MIN_TASKS)
  @Max(VALIDATION.LIMIT_MAX_TASKS)
  limit?: number = 20;

  @ApiProperty({
    example: 'Diseñar',
    description: 'Texto de búsqueda por nombre',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 1,
    description: 'Filtrar por ID de proyecto',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  project_id?: number;

  @ApiProperty({
    example: 1,
    description:
      'Filtrar por estado (0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiProperty({
    example: 2,
    description: 'Filtrar por prioridad',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;
}
