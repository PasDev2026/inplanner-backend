import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskAssignmentDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la tarea (se asigna desde la URL)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  task_id?: number;

  @ApiProperty({
    example: 2,
    description: 'ID del usuario a asignar a la tarea',
  })
  @IsInt()
  @IsNotEmpty()
  user_id: number;
}
