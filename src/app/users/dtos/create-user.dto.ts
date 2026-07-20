import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MaxLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'uuid-de-centralizado',
    description: 'UUID de la persona en centralizado',
  })
  @IsString()
  @IsNotEmpty()
  persona_uuid: string;

  @ApiProperty({
    example: '12345678',
    description: 'Número de documento del usuario',
  })
  @IsString()
  @IsNotEmpty()
  numero_documento: string;

  @ApiProperty({
    example: 'jperez@inplanner.com',
    description: 'Correo electrónico del usuario',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TEXT_MAX_LENGTH)
  name: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido paterno',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.TEXT_MAX_LENGTH)
  apellido_paterno?: string;

  @ApiProperty({
    example: 'García',
    description: 'Apellido materno',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.TEXT_MAX_LENGTH)
  apellido_materno?: string;

  @ApiProperty({
    example: '987654321',
    description: 'Teléfono del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.DNI_MAX_LENGTH)
  telefono?: string;

  @ApiProperty({ example: 1, description: 'ID del área a la que pertenece' })
  @IsInt()
  @IsNotEmpty()
  area_id: number;
}
