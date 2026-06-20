import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'Nombre de usuario para iniciar sesión',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  username: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Contraseña del usuario (mín. 6 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: 'La contraseña debe tener al menos 6 caracteres',
  })
  password: string;
}
