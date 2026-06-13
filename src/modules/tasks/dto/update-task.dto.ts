import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({ example: 'Diseñar base de datos', description: 'Nombre de la tarea', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  task_name?: string;

  @ApiProperty({ example: 'Descripción actualizada de la tarea', description: 'Descripción de la tarea', required: false })
  @IsOptional()
  @IsString()
  task_description?: string;

  @ApiProperty({ example: 1, description: 'ID del proyecto', required: false })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiProperty({ example: 2, description: 'ID de la tarea padre', required: false })
  @IsOptional()
  @IsInt()
  parent_task_id?: number;

  @ApiProperty({ example: 1, description: 'ID del usuario que completó', required: false })
  @IsOptional()
  @IsInt()
  completed_by_id?: number;

  @ApiProperty({ example: '2026-06-15', description: 'Fecha de inicio (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2026-07-15', description: 'Fecha de vencimiento (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({ example: 1, description: 'Estado: 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado', required: false })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({ example: 2, description: 'Prioridad: 1=baja, 2=media, 3=alta, 4=crítica', required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}
