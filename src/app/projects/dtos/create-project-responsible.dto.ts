import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectResponsibleDto {
  @ApiProperty({
    example: 1,
    description: 'ID del proyecto (se asigna desde la URL)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiProperty({
    example: 'uuid-del-usuario',
    description: 'UUID del usuario a asignar como responsable',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
