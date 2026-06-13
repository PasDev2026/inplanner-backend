import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiProperty({ example: 'Contenido actualizado de la nota', description: 'Nuevo contenido de la nota', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
