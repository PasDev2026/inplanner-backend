import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskStatusDto {
  @ApiProperty({ example: 2, description: 'Estado: 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado' })
  @IsInt()
  status: number;

  @ApiProperty({ example: 1, description: 'ID del usuario que completó la tarea (se asigna al cambiar a estado 4)', required: false })
  @IsOptional()
  @IsInt()
  completed_by_id?: number;
}
