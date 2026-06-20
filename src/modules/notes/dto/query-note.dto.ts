import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class QueryNoteDto {
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
    example: 1,
    description: 'Filtrar por ID de tarea',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  task_id?: number;
}
