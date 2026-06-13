import { IsBooleanString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryUserDto {
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

  @ApiProperty({ example: 'Juan', description: 'Texto de búsqueda por nombre, email o username', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'true', description: 'Filtrar por estado (true/false)', required: false })
  @IsOptional()
  @IsBooleanString()
  estado?: string;

  @ApiProperty({ example: 1, description: 'Filtrar por ID de área', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  area_id?: number;
}
