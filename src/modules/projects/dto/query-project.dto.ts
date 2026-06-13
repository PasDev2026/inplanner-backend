import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProjectDto {
  @ApiProperty({ example: 1, description: 'Número de página', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 20, description: 'Cantidad de registros por página (máx. 100)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ example: 'Implementación', description: 'Texto de búsqueda por nombre', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 1, description: 'Filtrar por estado (0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiProperty({ example: 2, description: 'Filtrar por prioridad', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiProperty({ example: 1, description: 'Filtrar por sede (ID de centralizado.sede)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sede_id?: number;

  @ApiProperty({ example: 5, description: 'Filtrar por manager (ID de usuario)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  manager_id?: number;

  @ApiProperty({ example: '2026-01-01', description: 'Fecha inicio del rango (start_date >= YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Fecha fin del rango (start_date <= YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({ example: 'start_date', description: 'Campo de ordenación. Valores permitidos: name_project, status, priority, start_date, due_date, created_at, updated_at, manager_id, sede_id, id_project', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'ASC', description: 'Dirección de ordenamiento: ASC o DESC', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
