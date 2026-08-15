import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAttachmentDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Filtra los adjuntos por ID de tarea',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  task_id?: number;
}
