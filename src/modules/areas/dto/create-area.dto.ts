import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ example: 'Recursos Humanos', description: 'Nombre del área' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del área es requerido' })
  @MaxLength(VALIDATION.TEXT_MAX_LENGTH, {
    message: 'El nombre del área no debe exceder los 100 caracteres',
  })
  nombre_area: string;
}
