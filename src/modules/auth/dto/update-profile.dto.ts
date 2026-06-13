import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Correo electrónico', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
