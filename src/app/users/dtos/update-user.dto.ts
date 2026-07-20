import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID del área a la que pertenece',
    required: false,
  })
  @IsOptional()
  @IsInt()
  area_id?: number;

  @ApiProperty({
    example: true,
    description: 'Estado del usuario (activo/inactivo)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
