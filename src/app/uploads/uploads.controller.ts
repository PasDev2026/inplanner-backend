import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'node:path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UploadsService,
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE,
} from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Subir imagen',
    description:
      'Sube una imagen (jpeg, png, webp, gif) asociada a una tarea y devuelve sus URLs firmadas',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        task_id: { type: 'integer' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagen subida, adjunto creado' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const extension = ALLOWED_MIMETYPES[file.mimetype];
        if (
          !extension ||
          extname(file.originalname).toLowerCase() !== extension
        ) {
          cb(
            new BadRequestException(
              'Solo se permiten imagenes jpeg, png, webp o gif',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('task_id') taskId: string,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    const taskIdNumber = Number(taskId);
    if (!Number.isInteger(taskIdNumber) || taskIdNumber <= 0) {
      throw new BadRequestException('task_id invalido');
    }
    return this.uploadsService.upload(file, taskIdNumber, userId);
  }
}
