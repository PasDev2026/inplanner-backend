import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiProperty({ example: 'Implementación Módulo RRHH', description: 'Nombre del proyecto', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name_project?: string;

  @ApiProperty({ example: 'Descripción actualizada del proyecto', description: 'Descripción del proyecto', required: false })
  @IsOptional()
  @IsString()
  description_project?: string;

  @ApiProperty({ example: 1, description: 'ID del usuario responsable', required: false })
  @IsOptional()
  @IsInt()
  manager_id?: number;

  @ApiProperty({ example: 1, description: 'ID de la sede asociada', required: false })
  @IsOptional()
  @IsInt()
  sede_id?: number;

  @ApiProperty({ example: '2026-06-01', description: 'Fecha de inicio (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Fecha de vencimiento (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({ example: 1, description: 'Estado: 0=Planificación, 1=Activo, 2=En espera, 3=Completado, 4=Cancelado', required: false })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({ example: 2, description: 'Prioridad: 1=baja, 2=media, 3=alta, 4=crítica', required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}
