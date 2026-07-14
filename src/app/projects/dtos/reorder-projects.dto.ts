import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderProjectDto {
  @ApiProperty({ description: 'ID del proyecto a mover' })
  @IsNumber()
  projectId: number;

  @ApiProperty({ required: false, description: 'Nuevo estado (opcional, si solo se reordena)' })
  @IsNumber()
  @IsOptional()
  targetStatus?: number;

  @ApiProperty({ description: 'Índice 0-based dentro de la columna destino' })
  @IsNumber()
  position: number;
}
