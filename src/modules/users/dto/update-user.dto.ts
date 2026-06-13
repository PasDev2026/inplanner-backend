import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'jperez', description: 'Nombre de usuario único', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiProperty({ example: 'jperez@inplanner.com', description: 'Correo electrónico único', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: 'MiPassword123', description: 'Nueva contraseña (mín. 6 caracteres)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password?: string;

  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

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

  @ApiProperty({ example: '12345678', description: 'DNI del usuario (único)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dni?: string;

  @ApiProperty({ example: '987654321', description: 'Teléfono del usuario', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: 1, description: 'ID del área', required: false })
  @IsOptional()
  @IsInt()
  area_id?: number;

  @ApiProperty({ example: [1, 2], description: 'IDs de las sedes', required: false, type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  sede_ids?: number[];

  @ApiProperty({ example: [15, 6], description: 'IDs de los roles: 15=Super Admin, 5=Jefatura, 6=Personal', required: false, type: [Number] })
  @IsOptional()
  @IsInt({ each: true })
  rol_ids?: number[];

  @ApiProperty({ example: true, description: 'Estado del usuario (activo/inactivo)', required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
