import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserAssignmentDto } from './create-user.dto';

export class UpdateUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID del área a la que pertenece',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
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

  @ApiProperty({
    type: () => [CreateUserAssignmentDto],
    required: false,
    description: 'Sedes y roles actuales del usuario en Centralizado',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUserAssignmentDto)
  asignaciones?: CreateUserAssignmentDto[];
}
