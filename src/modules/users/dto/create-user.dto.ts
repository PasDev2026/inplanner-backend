import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jperez', description: 'Nombre de usuario único para inicio de sesión' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: 'jperez@inplanner.com', description: 'Correo electrónico único del usuario' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'MiPassword123', description: 'Contraseña del usuario (mín. 6 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido paterno', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido_paterno?: string;

  @ApiProperty({ example: 'García', description: 'Apellido materno', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido_materno?: string;

  @ApiProperty({ example: '12345678', description: 'DNI del usuario (único)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dni: string;

  @ApiProperty({ example: '987654321', description: 'Teléfono del usuario', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: 1, description: 'ID del área a la que pertenece' })
  @IsInt()
  @IsNotEmpty()
  area_id: number;

  @ApiProperty({ example: [1, 2], description: 'IDs de las sedes (centralizado)', required: false, type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  sede_ids?: number[];

  @ApiProperty({ example: [15, 6], description: 'IDs de los roles: 15=Super Admin, 5=Jefatura, 6=Personal', required: false, type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  rol_ids?: number[];
}
