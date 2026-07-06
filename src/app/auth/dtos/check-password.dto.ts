import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckPasswordDto {
  @ApiProperty({
    example: 'MiPassword123',
    description: 'Contraseña a verificar',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
