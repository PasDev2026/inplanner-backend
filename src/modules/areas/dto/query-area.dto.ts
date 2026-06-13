import { IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAreaDto {
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

  @ApiProperty({ example: 'Recursos', description: 'Texto de búsqueda por nombre', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'true', description: 'Filtrar por estado (true/false)', required: false })
  @IsOptional()
  @IsBooleanString()
  estado?: string;
}
