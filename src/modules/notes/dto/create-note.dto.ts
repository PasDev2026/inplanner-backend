import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Revisar los requisitos con el equipo de desarrollo',
    description: 'Contenido de la nota',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 1,
    description: 'ID de la tarea a la que pertenece la nota',
  })
  @IsInt()
  @IsNotEmpty()
  task_id: number;
}
