import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION } from '../../../common/constants/validation.constants';

export class CreateTemplateItemDto {
  @ApiProperty({
    example: 'Vincular el número a Meta',
    description: 'Nombre del item',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TASK_NAME_MAX_LENGTH)
  item_name: string;

  @ApiProperty({
    example: 'Descripción de la actividad',
    description: 'Descripción del item',
    required: false,
  })
  @IsOptional()
  @IsString()
  item_description?: string;

  @ApiProperty({
    example: 1000,
    description: 'Posición para ordenamiento',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiProperty({
    example: 2,
    description: 'Prioridad: 1=baja, 2=media, 3=alta, 4=crítica',
    required: false,
  })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({
    type: () => [CreateTemplateItemDto],
    description: 'Subtareas anidadas del item',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateItemDto)
  children?: CreateTemplateItemDto[];
}
