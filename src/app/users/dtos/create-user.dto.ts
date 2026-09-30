import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserAssignmentDto {
  @ApiProperty({ example: 'uuid-de-la-sede' })
  @IsUUID()
  sede_uuid: string;

  @ApiProperty({ example: 'uuid-del-rol' })
  @IsUUID()
  rol_uuid: string;
}

export class CreateUserDto {
  @ApiProperty({
    example: 'uuid-del-tipo-documento',
    description: 'UUID del tipo de documento (DNI, etc.)',
  })
  @IsUUID()
  tipo_documento_uuid: string;

  @ApiProperty({ example: '12345678', description: 'Número de documento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numero_documento: string;

  @ApiProperty({ example: 'Juan', description: 'Nombres' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido paterno' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido_paterno: string;

  @ApiProperty({ example: 'García', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido_materno?: string;

  @ApiProperty({ example: '1990-01-01', description: 'Fecha de nacimiento' })
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({ example: 'M', description: 'Sexo: M o F' })
  @Matches(/^[MF]$/, { message: 'El sexo debe ser M o F' })
  sexo: string;

  @ApiProperty({ example: 'jperez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: 'Av. Siempre Viva 742', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      'La contraseña debe contener mayúscula, minúscula, número y carácter especial',
  })
  password: string;

  @ApiProperty({ example: 'Password1!' })
  @IsString()
  @MinLength(8)
  repetir_password: string;

  @ApiProperty({ example: 1, required: false, description: 'Área (inplanner)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  area_id?: number;

  @ApiProperty({ type: () => [CreateUserAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUserAssignmentDto)
  asignaciones: CreateUserAssignmentDto[];
}
