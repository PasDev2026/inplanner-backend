import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttachmentPreview } from '../entities/attachment.entity';

export class CreateAttachmentDto {
  @ApiProperty({
    example: 'informe-final.webp',
    description: 'Nombre del archivo',
  })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({ example: 'image/webp', description: 'MIME type del archivo' })
  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @ApiProperty({
    example: 20480,
    description: 'Tamaño en bytes del archivo original',
  })
  @IsInt()
  bytes: number;

  @ApiProperty({
    example: 'uploads/notes/abc-123.png',
    description: 'Ruta relativa en disco',
  })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ example: 1, description: 'ID de la tarea a la que pertenece' })
  @IsInt()
  @IsNotEmpty()
  task_id: number;

  @ApiProperty({
    example: [{ width: 150, height: 81, bytes: 1116 }],
    description: 'Miniaturas generadas',
  })
  previews: AttachmentPreview[];
}
