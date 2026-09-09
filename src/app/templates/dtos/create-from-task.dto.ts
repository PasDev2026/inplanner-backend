import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION } from '../../../common/constants/validation.constants';

export class CreateFromTaskDto {
  @ApiProperty({
    example: 42,
    description:
      'ID de la tarea cuyo árbol (con subtareas) se guardará como plantilla',
  })
  @IsInt()
  @IsNotEmpty()
  task_id: number;

  @ApiProperty({
    example: 'Creación de un nuevo canal',
    description: 'Nombre de la plantilla a crear',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TASK_NAME_MAX_LENGTH)
  template_name: string;
}
