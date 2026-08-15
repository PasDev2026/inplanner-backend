import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
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
import { AttachmentsService } from '../attachments/attachments.service';
import {
  PREVIEW_WIDTHS,
  previewFileName,
} from '../attachments/attachment-files.util';
import type { AttachmentPreview } from '../attachments/entities/attachment.entity';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'notes');

const ALLOWED_MIMETYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

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
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const extension = ALLOWED_MIMETYPES[file.mimetype];
          cb(null, `${randomUUID()}${extension}`);
        },
      }),
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

    const { default: sharp } = await import('sharp');
    const previews: AttachmentPreview[] = [];
    for (const width of PREVIEW_WIDTHS) {
      const outPath = previewFileName(file.path, width);
      const info = await sharp(file.path)
        .resize({ width })
        .webp({ quality: 80 })
        .toFile(outPath);
      previews.push({
        width: info.width,
        height: info.height,
        bytes: info.size,
      });
    }

    return this.attachmentsService.create(
      {
        file_name: file.originalname,
        mime_type: file.mimetype,
        bytes: file.size,
        file_path: file.path,
        task_id: taskIdNumber,
        previews,
      },
      userId,
    );
  }
}
