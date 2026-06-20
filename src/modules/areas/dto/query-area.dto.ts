import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAreaDto {
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
    example: 'Recursos',
    description: 'Texto de búsqueda por nombre',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 'true',
    description: 'Filtrar por estado (true/false)',
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  estado?: string;
}
