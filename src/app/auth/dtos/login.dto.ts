import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '12345678',
    description: 'Número de documento para iniciar sesión',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  numero_documento: string;

  @ApiProperty({
    example: '********',
    description: 'Contraseña del usuario (mín. 6 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  })
  password: string;
}
