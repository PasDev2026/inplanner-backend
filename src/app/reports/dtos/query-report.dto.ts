import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class QueryReportDto {
  @ApiProperty({ example: 1, description: 'Número de página', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.PAGE_NUMBER_MIN)
  page?: number = 1;

  @ApiProperty({
    example: 50,
    description: 'Cantidad de registros por página (máx. 100)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(VALIDATION.LIMIT_MIN)
  @Max(VALIDATION.LIMIT_MAX)
  limit?: number = 50;

  @ApiProperty({
    example: 'Implementación',
    description: 'Texto de búsqueda por nombre',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: '0,1,2',
    description:
      'Filtrar por estado (coma-separado). Tareas: 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado. Proyectos: 0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: '1,2',
    description:
      'Filtrar por prioridad (coma-separado: 1=Baja, 2=Media, 3=Alta, 4=Crítica)',
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({
    example: '1,3',
    description: 'Filtrar por sede (IDs separados por coma)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sede_id?: string;

  @ApiProperty({
    example: 'uuid-1,uuid-2',
    description:
      'Filtrar por responsables de la tarea (IDs separados por coma)',
    required: false,
  })
  @IsOptional()
  @IsString()
  responsible_id?: string;

  @ApiProperty({
    example: '1,2',
    description: 'Filtrar por proyecto (IDs separados por coma)',
    required: false,
  })
  @IsOptional()
  @IsString()
  project_id?: string;

  @ApiProperty({
    example: '2026-01-01',
    description: 'Fecha inicio del rango (start_date >= YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Fecha fin del rango (start_date <= YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    example: 'due_date',
    description: 'Campo de ordenación',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    example: 'ASC',
    description: 'Dirección de ordenamiento: ASC o DESC',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
