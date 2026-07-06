import { PartialType } from '@nestjs/mapped-types';
import { CreateAreaDto } from './create-area.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAreaDto extends PartialType(CreateAreaDto) {
  @ApiProperty({
    example: true,
    description: 'Estado del área (activo/inactivo)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
