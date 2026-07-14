import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MaxLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Diseñar base de datos',
    description: 'Nombre de la tarea',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TASK_NAME_MAX_LENGTH)
  task_name: string;

  @ApiProperty({
    example:
      'Crear el esquema de base de datos según los requerimientos definidos',
    description: 'Descripción detallada de la tarea',
    required: false,
  })
  @IsOptional()
  @IsString()
  task_description?: string;

  @ApiProperty({
    example: 1,
    description: 'ID del proyecto al que pertenece la tarea',
  })
  @IsInt()
  @IsNotEmpty()
  project_id: number;

  @ApiProperty({
    example: null,
    description: 'ID de la tarea padre (para subtareas)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  parent_task_id?: number;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario que completó la tarea',
    required: false,
  })
  @IsOptional()
  @IsInt()
  completed_by_id?: number;

  @ApiProperty({
    example: '2026-06-15',
    description: 'Fecha de inicio (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    example: '2026-07-15',
    description: 'Fecha de vencimiento (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({
    example: 0,
    description:
      'Estado: 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado',
    required: false,
  })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({
    example: 2,
    description: 'Prioridad: 1=baja, 2=media, 3=alta, 4=crítica',
    required: false,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({
    example: 1000,
    description: 'Posición para ordenamiento',
    required: false,
  })
  @IsOptional()
  @IsInt()
  position?: number;
}
