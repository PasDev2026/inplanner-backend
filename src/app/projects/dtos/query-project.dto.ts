import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProjectDto {
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
  @Min(VALIDATION.LIMIT_MIN)
  @Max(VALIDATION.LIMIT_MAX)
  limit?: number = 20;

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
      'Filtrar por estado (coma-separado: 0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado)',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    example: '1,2',
    description: 'Filtrar por prioridad (coma-separado)',
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
    example: 'uuid-del-usuario',
    description: 'Filtrar por manager (UUID de usuario)',
    required: false,
  })
  @IsOptional()
  @IsString()
  manager_id?: string;

  @ApiProperty({
    example: '3,7',
    description: 'Filtrar por responsable (IDs separados por coma)',
    required: false,
  })
  @IsOptional()
  @IsString()
  responsible_id?: string;

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
    example: 'start_date',
    description:
      'Campo de ordenación. Valores permitidos: name_project, status, priority, start_date, due_date, created_at, updated_at, manager_id, sede_id, id_project',
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
