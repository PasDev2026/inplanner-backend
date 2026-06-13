import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ example: 'Recursos Humanos', description: 'Nombre del área' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del área es requerido' })
  @MaxLength(100, { message: 'El nombre del área no debe exceder los 100 caracteres' })
  nombre_area: string;
}
