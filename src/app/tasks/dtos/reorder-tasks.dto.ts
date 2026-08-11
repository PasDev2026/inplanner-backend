import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderTaskDto {
  @ApiProperty({ description: 'ID de la tarea a mover' })
  @IsNumber()
  taskId: number;

  @ApiProperty({
    required: false,
    description: 'Nuevo estado (opcional, si solo se reordena)',
  })
  @IsNumber()
  @IsOptional()
  targetStatus?: number;

  @ApiProperty({
    required: false,
    description:
      'Nueva tarea padre (opcional). Omitir o null = moverse a la raíz del proyecto',
  })
  @IsNumber()
  @IsOptional()
  parentTaskId?: number;

  @ApiProperty({ description: 'Índice 0-based dentro de la columna destino' })
  @IsNumber()
  position: number;
}
