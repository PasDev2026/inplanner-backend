import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { CreateTemplateItemDto } from './create-template-item.dto';

export class UpdateTemplateDto {
  @ApiProperty({
    example: 'Creación de un nuevo canal',
    description: 'Nombre de la plantilla',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.TASK_NAME_MAX_LENGTH)
  template_name?: string;

  @ApiProperty({
    type: () => [CreateTemplateItemDto],
    description:
      'Reemplaza el árbol completo de tareas y subtareas de la plantilla',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateItemDto)
  items?: CreateTemplateItemDto[];
}
