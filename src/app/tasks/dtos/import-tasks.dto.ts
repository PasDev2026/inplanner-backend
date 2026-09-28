import { IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const toOptionalNumber = ({
  value,
}: {
  value: unknown;
}): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : (value as number);
};

export class ImportTasksDto {
  @ApiProperty({
    example: 1,
    description: 'ID del proyecto donde se crearán las tareas',
  })
  @Transform(toOptionalNumber)
  @IsInt()
  project_id: number;

  @ApiProperty({
    example: null,
    description:
      'ID de la tarea padre: todas las actividades raíz cuelgan de ella',
    required: false,
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  parent_task_id?: number;
}
