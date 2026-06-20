import { IsEmail, IsOptional, IsString } from 'class-validator';
import { MaxLength } from 'class-validator';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.TEXT_MAX_LENGTH)
  name?: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
