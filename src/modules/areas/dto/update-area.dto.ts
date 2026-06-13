import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAreaDto {
  @ApiProperty({ example: 'Recursos Humanos', description: 'Nombre del área', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El nombre del área no debe exceder los 100 caracteres' })
  nombre_area?: string;

  @ApiProperty({ example: true, description: 'Estado del área (activo/inactivo)', required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
