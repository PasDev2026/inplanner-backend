import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { AttachmentsService } from '../attachments/attachments.service';
import {
  PREVIEW_WIDTHS,
  previewFileName,
} from '../attachments/attachment-files.util';
import type { AttachmentPreview } from '../attachments/entities/attachment.entity';
import { s3, S3_BUCKET } from './s3.client';

export const ALLOWED_MIMETYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadsService {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  async upload(file: Express.Multer.File, taskId: number, userId: string) {
    const { default: sharp } = await import('sharp');
    const extension = ALLOWED_MIMETYPES[file.mimetype];
    const fileName = `${randomUUID()}${extension}`;
    const key = `inplanner/notes/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const previews: AttachmentPreview[] = [];
    for (const width of PREVIEW_WIDTHS) {
      const previewKey = previewFileName(key, width);
      const info = await sharp(file.buffer)
        .resize({ width })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: previewKey,
          Body: info.data,
          ContentType: 'image/webp',
        }),
      );
      previews.push({
        width: info.info.width,
        height: info.info.height,
        bytes: info.info.size,
      });
    }

    return this.attachmentsService.create(
      {
        file_name: file.originalname,
        mime_type: file.mimetype,
        bytes: file.size,
        file_path: key,
        task_id: taskId,
        previews,
      },
      userId,
    );
  }
}
