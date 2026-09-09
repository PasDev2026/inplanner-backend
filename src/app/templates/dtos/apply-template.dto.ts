import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyTemplateDto {
  @ApiProperty({
    example: 1,
    description: 'ID del proyecto donde se crearán las tareas',
  })
  @IsInt()
  @IsNotEmpty()
  project_id: number;

  @ApiProperty({
    example: null,
    description:
      'ID de la tarea padre (si la plantilla se aplica como subtareas)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  parent_task_id?: number;
}
