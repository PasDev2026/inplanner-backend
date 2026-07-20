import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
    example: 'uuid-del-usuario',
    description: 'UUID del usuario a asignar a la tarea',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
