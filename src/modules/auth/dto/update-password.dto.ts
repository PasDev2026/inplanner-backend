import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'currentPass123',
    description: 'Contraseña actual del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  current_password: string;

  @ApiProperty({
    example: 'newPass456',
    description: 'Nueva contraseña (mín. 8 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH_UPDATE, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  new_password: string;
}
