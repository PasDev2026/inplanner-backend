import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
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
    example: 2,
    description: 'ID del usuario a asignar como responsable',
  })
  @IsInt()
  @IsNotEmpty()
  user_id: number;
}
