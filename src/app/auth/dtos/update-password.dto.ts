import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'MiPasswordActual123',
    description: 'Contraseña actual del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  current_password: string;

  @ApiProperty({
    example: 'MiNuevoPassword456',
    description: 'Nueva contraseña (mín. 6 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  new_password: string;
}
