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

export class CreateProjectDto {
  @ApiProperty({
    example: 'Implementación Módulo RRHH',
    description: 'Nombre del proyecto',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TASK_NAME_MAX_LENGTH)
  name_project: string;

  @ApiProperty({
    example:
      'Desarrollo del módulo de recursos humanos para la gestión de personal',
    description: 'Descripción detallada del proyecto',
    required: false,
  })
  @IsOptional()
  @IsString()
  description_project?: string;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario responsable del proyecto',
  })
  @IsInt()
  @IsNotEmpty()
  manager_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID de la sede asociada (centralizado)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  sede_id?: number;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Fecha de inicio del proyecto (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Fecha de vencimiento del proyecto (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({
    example: 1,
    description:
      'Estado del proyecto (0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({
    example: 2,
    description: 'Prioridad del proyecto (1=baja, 2=media, 3=alta, 4=crítica)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({
    example: 0,
    description:
      'Nivel de privacidad (0=Público, 1=Solo área, 2=Solo sede, 3=Solo mencionados, 4=Privado)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  privacy_level?: number;
}
