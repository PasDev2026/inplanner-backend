import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryNoteDto {
  @ApiProperty({ example: 1, description: 'Número de página', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 50, description: 'Cantidad de registros por página (máx. 100)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({ example: 1, description: 'Filtrar por ID de tarea', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  task_id?: number;
}
